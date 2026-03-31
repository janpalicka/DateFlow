import { mountShowcase } from "@/showcase/showcase";
import "./showcase/showcase.css";

const app = document.querySelector("#app");
if (!(app instanceof HTMLElement)) {
  throw new Error("#app missing");
}
mountShowcase(app);
