
export function search(fuse: any,query: string, data: any[]) {

     if (!query.trim()) {
        console.log('data',data)
        return data
      } else {
        const keywords = query
          .toLowerCase()
          .split(/\s+/)
          .filter((k) => k);
        // Map to store item and its match count
        const scoreMap = new Map();
        keywords.forEach((word) => {
          const searchResults = fuse.search(word).map((r) => r.item);
          searchResults.forEach((item) => {
            scoreMap.set(item, (scoreMap.get(item) || 0) + 1);
          });
        });
        // Convert map to array and sort by match count descending
        const rankedResults = [...scoreMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .map((entry) => entry[0]);
     console.log('rankedResults',rankedResults)
        return rankedResults
      }
  
}
