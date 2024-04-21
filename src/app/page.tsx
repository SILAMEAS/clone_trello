import React from "react";
import { Button } from "@nextui-org/react";
import BlurStyle from "./lib/blur-style";
import Link from "next/link";
import { ArrowLongRightIcon } from "@heroicons/react/16/solid";

export default function App() {
  return (
    <main className="-mt-10 transition ease-in-out delay-150 duration-150">
      <section className="container  h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        <h1 className="pb-2 text-4xl md:text-6xl xl:text-8xl font-bold text-center bg-gradient-to-r from-primary to-danger bg-clip-text text-transparent">
          Make your life <br /> easy with{" "}
          <span className="text-blue-600"> Trello</span>
        </h1>
        <BlurStyle />
        <p className="mt-5 text-default-500 text-center leading-8">
          A platform that you can managing your task and make decision in the same place. <br className="lg:block hidden" /> enjoy your free tool here with no limit.
        </p>
        <Button color="primary" variant="shadow" className="mt-5" endContent={<ArrowLongRightIcon className="h-6 w-6" />}>
          <Link href={"/services"}>Get Started</Link>
        </Button>
      </section>
    </main>
  );
}
