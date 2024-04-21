import { Card, CardFooter } from "@nextui-org/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import withAuth from "@/page-auth/withAuth";

type Props = {};

const services = [
  {
    name: "Task Management",
    url: "/task-management",
    image: "/Task.jpg",
  },
  {
    name: "Judge Everything",
    url: "/judge",
    image: "/jude.webp",
  },
];

const Services = (props: Props) => {
  return (
    <main className="container">
      <h1 className="mt-5 text-4xl font-bold text-center text-primary-500">
        Services
      </h1>

      <div className="mt-10 gap-10 grid md:grid-cols-2 xl:grid-cols-4">
        {services.map((service) => (
          <Link href={"/services/" + service.url} key={service.url}>
            <Card
              isFooterBlurred
              key={service.url}
              className="shadow-lg h-80  hover:scale-95 border shadow-primary-100"
            >
                <Image
                    alt=""
                    className="object-cover w-full h-full pb-5"
                    height={1000}
                    src={service.image}
                    width={1000}
                    priority
                />
              <CardFooter className="justify-center before:bg-white/10 border-white/20 border-2 overflow-hidden py-2 absolute before:rounded-xl rounded-large bottom-2 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
                <p className="text-primary-500 font-semibold">
                  {service.name}
                </p>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default withAuth(Services);
