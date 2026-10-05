import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { Languages } from "@/components/sections/languages";
import { Principles } from "@/components/sections/principles";
import { Projects } from "@/components/sections/projects";
import { Services } from "@/components/sections/services";
import { Skills } from "@/components/sections/skills";

/** Server Component: the whole page is pre-rendered to static HTML at build time. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Services />
      <Skills />
      <Experience />
      <Projects />
      <Principles />
      <Languages />
      <Contact />
    </>
  );
}
