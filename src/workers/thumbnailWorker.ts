/**
 * Worker process for thumbnail generation.
 * Emits granular progress updates to the Next.js app by POSTing to /api/worker/progress
 */
import { Worker } from "bullmq";
import connection from "../lib/queue.js";
import { getGeminiAI } from "../lib/geminiai.ts";
import { uploadBuffer, getSignedUrl } from "../lib/s3.ts";
import { prisma } from "../lib/prisma.js";
import Redis from "ioredis";
import path from "path";
import fs from "fs";
const imagePath = path.join(process.cwd(), "public", "after.png");

async function imageToBase64Async(imagePath) {
  const fs = await import("fs/promises");
  try {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString("base64");
  } catch (error) {
    console.error("Error reading image file:", error);
    throw error;
  }
}

const redis = new Redis({
  port: parseInt(process.env.REDIS_PORT || ""), // Redis port
  host: process.env.REDIS_HOST, // Redis host
  username: process.env.REDIS_USERNAME, // needs Redis >= 6
  password: process.env.REDIS_PASSWORD,
  db: 0, // Defaults to 0
});

// Note: This requires a global fetch implementation (modern browser or Node.js with a polyfill/native fetch)
// and assumes the URL is publicly accessible.

async function s3UrlToBase64OpenAIPart(url: string) {
  try {
    // 1. Fetch the image data from the URL
    const awsUrl = `https://thumbnailgenai.s3.ap-south-1.amazonaws.com/${url}`;
    const response = await fetch(awsUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    return {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    };
  } catch (error) {
    console.error("Error converting S3 URL to Base64:", error);
    throw error; // Re-throw the error for handling upstream
  }
}

const worker = new Worker(
  "thumbnailQueue",
  async (job) => {
    console.log("Processing job", job.id);
    try {
      const { thumbnailId, thumbnailVersionId } = job.data;
      console.log("Job data", job);
      if (job.name === "generate") {
        const thumbnailVersion = await prisma.thumbnailVersion.findUnique({
          where: { id: thumbnailVersionId },
          include: {
            thumbnail: {
              include: {
                channel: true,
              },
            },
          },
        });

        const inputUrl = thumbnailVersion?.thumbnail?.inputImage || "";

        if (!inputUrl) {
          console.error("Thumbnail version not found", thumbnailVersionId);
          return;
        }
        const input = await s3UrlToBase64OpenAIPart(inputUrl);

        if (!thumbnailVersion) {
          console.error("Thumbnail version not found", thumbnailVersionId);
          return;
        }

        const inputArray = thumbnailVersion?.input as Array<{
          type: string;
          message: string;
          suggestions?: string[];
        }>;

        const messageString = inputArray[0]?.message as string;
        const regex =
          /title:(.*?); description:(.*?); style:(.*?); thumbnailText:(.*)/;

        const match = messageString.match(regex);

        let title = "";
        let description = "";
        let style = "";
        let thumbnailText = "";

        if (match) {
          // match[1] is the content captured by the first (.*?)
          title = match[1].trim();
          // match[2] is the content captured by the second (.*?)
          description = match[2].trim();
          // match[3] is the content captured by the third (.*?)
          style = match[3].trim();
          // match[4] is the content captured by the fourth (.*)
          thumbnailText = match[4].trim();
        }
        console.log(thumbnailText, "thumbnailText");

        const channel = thumbnailVersion?.thumbnail?.channel;

        const brandGuidelines = channel?.brandGuidelines || "";

        const logoPart = channel?.logoUrl
          ? await s3UrlToBase64OpenAIPart(channel.logoUrl)
          : null;

        const finalPrompt = `
## **THUMBNAIL VISUAL SPECIFICATION: THE WIDESCREEN RULE**
- **FORMAT IMPERATIVE:** This image **MUST** be a single, uninterrupted, high-resolution **16:9 widescreen, horizontal** frame. This is non-negotiable.
- **ABSOLUTE FORBIDDANCE:** **DO NOT** use any aspect ratio other than 16:9. **FORBIDDEN** are borders, padding, black bars (letterboxing/pillarboxing), or framing of any kind.
- **DIMENSIONS:** Generate at 1920x1080 or 1280x720 pixels.
- **NEGATIVE INFLUENCE:** No square, no portrait, no padding, no borders, no empty space, no "image within an image" effect.

---

## THE CORE CONCEPT: MAXIMIZING CLICK-THROUGH-RATE (CTR)
- **PURPOSE:** YouTube Thumbnail. Engineered for maximum visual impact and immediate curiosity.
- **AESTHETIC STYLE:** **${style}** (Must be vibrant, hyper-realistic, and optimized for small screen viewing).
- **CHANNEL DRAMA:** **${
          channel?.category
        }** (Use this category to inform the core mood/emotional tone of the scene).

---

## THE SUBJECT, STORY, AND SCENE COMPOSITION
- **VISUAL HOOK (The Protagonist):** The **first uploaded photo** must be the **prominent, emotional, and dynamic focal point** of the 16:9 composition. The subject should be expressive—showcasing excitement, shock, concentration, or the key emotion driving the video's title.
- **VIDEO TITLE:** Incorporate the concept and intensity of: "${title}, don't add this title in thumbnail."
- **DESCRIPTION (The Cinematic Scene):** "${description}"
    * *The description must be fully realized as a **dynamic, full-width, immersive background** that utilizes every inch of the 16:9 canvas to tell the story. Create high-stakes action or an intriguing, detailed environment.*
- **CONTEXTUAL OBJECTS:** **Crucially, integrate specific objects and elements directly relevant to the video's content, drawing inspiration from both the "${title}" and "${description}".** These objects should be strategically placed to amplify the narrative and intrigue, providing visual clues about the video's topic.

---

## THE TEXT OVERLAY: THE CTA (CALL TO ACTION)
${
  thumbnailText
    ? `
- **IMPACT TEXT:** **Boldly and artistically integrate** the text: **"${thumbnailText}"**.
    * **DESIGN & PLACEMENT:** The text must be a large, non-distracting element that complements the 16:9 background image. Use **shadows, outlines, or glow effects** to ensure it is instantly readable against the complex backdrop. Strategically place it to maximize readability without covering the primary subject's face/key action.
`
    : ""
}

---

## TECHNICAL & BRANDING EXECUTION
- **BRAND SIGNATURE:** Subtly and non-obtrusively place the **channel logo/branding from the second uploaded image** in one of the corners (e.g., lower right) to maintain brand recognition without detracting from the primary subject or text.
- **GUIDELINES:** **${brandGuidelines}** (Apply these to colors, font suggestion, and overall visual density).
- **FINAL IMAGE QUALITY:** **Hyper-realistic, cinematic lighting, studio-grade high-fidelity detail, and razor-sharp focus.** The final result must look like a professional, polished photograph designed to stop a viewer's scroll.
`;

        console.log(finalPrompt, "finalPrompt");

        const sendProgress = async (status, pct = 0, meta = {}) => {
          try {
            await redis.publish(
              "thumbnailGenerate:progress",
              JSON.stringify({
                thumbnailVersionId,
                jobId: job.id,
                status,
                pct,
                meta,
                timestamp: Date.now(),
              })
            );
            console.log(
              `Progress sent: ${status} ${pct}% for ${thumbnailVersionId}`
            );
          } catch (err) {
            console.error("Progress report failed", err);
          }
        };

        await sendProgress("started", 2);
        try {
          await sendProgress("requesting_generation", 5);
          const geminiai = getGeminiAI();
          let response;
          try {
            response = await geminiai.models.generateContent({
              model: "gemini-2.5-flash-image",
              contents: [
                {
                  text: finalPrompt,
                },
                {
                  ...input,
                },
                ...(logoPart ? [logoPart] : []),
              ],
              config: {
                responseModalities: ["IMAGE"],
                imageConfig: {
                  aspectRatio: "16:9",
                },
                candidateCount: 1,
              },
            });
          } catch (err) {
            console.error("OpenAI error", err);
            await sendProgress("failed", 0, { error: String(err) });
            throw err;
          }

          console.log(
            response.candidates[0].content.parts.length,
            "response.candidates[0].content.parts.length"
          );
          const buffer = Buffer.from(
            response.candidates[0].content.parts[0].inlineData.data,
            "base64"
          );
          fs.writeFileSync("photorealistic_example.png", buffer);
          console.log("Image saved as photorealistic_example.png");
          await sendProgress("generated", 50);

          const key = `thumbnails/${thumbnailVersionId}.png`;
          const s3 = await uploadBuffer(key, buffer, "image/png");

          await prisma.thumbnailVersion.update({
            where: { id: thumbnailVersionId },
            data: { s3Key: s3.Key },
          });
          await sendProgress("uploaded", 95);

          const signed = await getSignedUrl(key, 3600);

          await sendProgress("completed", 100, { s3Key: signed });

          console.log("Job finished", job.id);
        } catch (err) {
          console.error("Job error", err);
          await sendProgress("failed", 0, { error: String(err) });
          throw err;
        }
      } else if (job.name === "edit") {
        let message;

        const sendProgress = async (status, pct = 0, meta = {}) => {
          try {
            await redis.publish(
              "thumbnailEdit:progress",
              JSON.stringify({
                thumbnailVersionId,
                jobId: job.id,
                status,
                pct,
                meta,
                timestamp: Date.now(),
              })
            );
            console.log(
              `Progress sent: ${status} ${pct}% for ${thumbnailVersionId}`
            );
          } catch (err) {
            console.error("Progress report failed", err);
          }
        };

        const thumbnails = await prisma.thumbnailVersion.findMany({
          where: {
            thumbnailId: thumbnailId,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        const requestVersion = thumbnails.find(
          (item) => item.id === thumbnailVersionId
        );
        const latestS3 = thumbnails.find((item) => item.s3Key !== null)?.s3Key;

        if (!latestS3) {
          console.error("Latest version not found", thumbnailVersionId);
          return;
        }

        if (!requestVersion) {
          console.error("Thumbnail version not found", thumbnailVersionId);
          return;
        }

        if (requestVersion?.input) {
          const input = requestVersion.input as Array<{
            type: string;
            message: string;
            suggestions?: string[];
          }>;

          message = input.find((item) => item?.type === "user")?.message;
        }

        if (!message) {
          await sendProgress("failed", 0, { error: "No message found" });
          throw new Error("No message found");
        }

        await sendProgress("started", 2);
        await sendProgress("requesting_generation", 5);

        const input = await s3UrlToBase64OpenAIPart(latestS3);

        const geminiai = getGeminiAI();
        let response;
        try {
          const finalPrompt = `
## **IMAGE EDITING SPECIFICATION**

- **TARGET IMAGE:** Apply all requested edits to the image provided in the 'input' field.

- **USER'S REQUESTED CHANGES:** "${message}"
  * **INSTRUCTION:** Interpret these changes precisely and implement them while maintaining the core aesthetic and subject of the original image, unless explicitly stated otherwise in the changes.

---

## **EDITING GUIDELINES (Maintain Original Quality)**

- **FORMAT IMPERATIVE:** The final edited image **MUST** remain a single, uninterrupted, high-resolution **16:9 widescreen, horizontal** frame. This is non-negotiable.
- **ABSOLUTE FORBIDDANCE:** **DO NOT** introduce borders, padding, black bars (letterboxing/pillarboxing), or framing of any kind, unless specifically requested in 'changesRequested'.
- **DIMENSIONS:** Maintain the original dimensions (e.g., 1920x1080 or 1280x720 pixels) unless a resize is requested.
- **AESTHETIC STYLE:** Preserve the original aesthetic style (e.g., hyper-realistic, cinematic lighting, studio-grade high-fidelity detail) unless the 'changesRequested' explicitly alters it.

---

## **SPECIFIC EDITING ACTIONS (Based on 'changesRequested')**

- **SUBJECT MODIFICATION:** If changes relate to the primary subject (e.g., expression, clothing, adding/removing elements), apply them carefully.
- **BACKGROUND/SCENE MODIFICATION:** If changes relate to the background or environment, integrate them seamlessly into the existing 16:9 canvas.
- **OBJECT MODIFICATION:** If changes involve adding, removing, or altering contextual objects, ensure they remain relevant to the video's inferred content, unless the user's request dictates otherwise.
- **TEXT OVERLAY MODIFICATION:**
  * If 'changesRequested' involves altering, adding, or removing text, ensure new text is integrated with appropriate design (shadows, outlines, glow) for readability, respecting existing placement if possible.
- **BRANDING MODIFICATION:** If 'changesRequested' affects the channel logo/branding, apply those changes while maintaining subtlety and non-obtrusiveness.

---

## **FINAL IMAGE QUALITY**
- Ensure the edited image retains **hyper-realistic, cinematic lighting, studio-grade high-fidelity detail, and razor-sharp focus.** The final result must look like a professionally adjusted and polished photograph.
`;

          response = await geminiai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [
              {
                text: finalPrompt,
              },
              {
                ...input,
              },
            ],
            config: {
              responseModalities: ["IMAGE"],
              imageConfig: {
                aspectRatio: "16:9",
              },
              candidateCount: 1,
            },
          });

          // const resp = response.choices[0];
          await sendProgress("generated", 50);

          const buffer = Buffer.from(
            response.candidates[0].content.parts[0].inlineData.data,
            "base64"
          );

          const key = `thumbnails/${thumbnailVersionId}.png`;
          const s3 = await uploadBuffer(key, buffer, "image/png");

          await prisma.thumbnailVersion.update({
            where: { id: thumbnailVersionId },
            data: { s3Key: s3.Key },
          });
          await sendProgress("uploaded", 95);

          const signed = await getSignedUrl(key, 3600);

          await sendProgress("completed", 100, { s3Key: signed });

          console.log("Job finished", job.id);
        } catch (err) {
          console.error("Job error", err);
          await sendProgress("failed", 0, { error: String(err) });
          throw err;
        }
      }
    } catch (err) {
      console.error(err);
    }
  },
  { connection, concurrency: 3 }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error("Job failed", job?.id, err);
});
