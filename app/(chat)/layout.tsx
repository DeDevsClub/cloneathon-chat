import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '../(auth)/auth';
import Script from 'next/script';
// import { AnimatedGridBackgroundSection } from '@/components/animated-grid';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
  // console.log({ session });

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      {/* <AnimatedGridBackgroundSection> */}
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={session?.user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
      {/* </AnimatedGridBackgroundSection> */}
    </>
  );
}
