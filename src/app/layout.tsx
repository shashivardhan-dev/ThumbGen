// app/layout.tsx

import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from "react";
import { SocketProvider } from '../components/sockets/SocketProvider';
import StoreProvider from './storeProvider';
import ToastProvider from "../components/ToastProvider";
import { ToggleProvider } from "../contexts/toggle";


interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <StoreProvider>
            <SocketProvider debug={process.env.NODE_ENV === 'development'}>
              <ToggleProvider>
                <ToastProvider />
                <main>{children}</main>
              </ToggleProvider>
            </SocketProvider>
          </StoreProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
