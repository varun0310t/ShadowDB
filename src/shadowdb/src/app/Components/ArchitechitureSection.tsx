import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const ArchitectureSection = ({
  isClient,
  status,
}: {
  isClient: boolean;
  status: string;
}) => {
  return (
    <section className="py-20 px-4 bg-purple-600 text-center">
      <h2 className="text-3xl font-bold mb-6">
        Curious how we manage your data ?
      </h2>
      <p className="text-xl mb-8">
        {" "}
        We ensure security, scalability, and reliability with a modern
        architecture.{" "}
      </p>

      <Button size="lg" variant="secondary">
        <Link href="/System-Design">Our Architecture</Link>
      </Button>
    </section>
  );
};
