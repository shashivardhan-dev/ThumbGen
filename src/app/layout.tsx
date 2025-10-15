//app/layout.tsx
import './globals.css'
import { Providers } from "./providers"
import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]/route"
import { ReactNode } from "react"
import { SocketProvider } from '../components/sockets/SocketProvider';
import StoreProvider from './storeProvider'
import ToastProvider from "../components/ToastProvider"
import { ClientWrapper } from "../components/ClientWrapper"
 const metadata = { title: 'YouThumbnail' };

 interface RootLayoutProps {
  children: ReactNode
}
export default  async function RootLayout({ children }: RootLayoutProps) {
 const session = await getServerSession(authOptions)



  return (
    <html>
      <body>
        <ClientWrapper >
        <ToastProvider />
        </ClientWrapper>
        <StoreProvider>
       <SocketProvider debug={process.env.NODE_ENV === 'development'}>
         <Providers session={session}>
        <main>{children}</main>
        </Providers>
        </SocketProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
