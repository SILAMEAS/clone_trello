import React, { PropsWithChildren } from "react";
import { NextUIProviders } from "./next-ui-provider";
import { Provider as JotaiProvider } from "jotai";
import NavbarComponent from "../components/general/nav-bar";
import { Toaster } from "sonner";
import { ThemeProvider as NextThemesProvider } from "next-themes";
const RootProvider = ({ children }: PropsWithChildren) => {
  return (
    <JotaiProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        <NextUIProviders>
          <Toaster richColors />
          <div className="dark:hidden opacity-0 absolute inset-0 -z-40 h-full w-full bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>
          <div className="opacity-20 absolute inset-0 -z-40 h-full w-full bg-[linear-gradient(to_right,#a39f9e_1px,transparent_1px),linear-gradient(to_bottom,#a39f9e_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>
          <NavbarComponent />
          {children}
        </NextUIProviders>
      </NextThemesProvider>
    </JotaiProvider>
  );
};

export default RootProvider;
