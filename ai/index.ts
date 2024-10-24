import { groq } from "@ai-sdk/groq";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";
import { customMiddleware } from "./custom-middleware";

export const customModel = wrapLanguageModel({
  model: groq("llama-3.1-70b-versatile"),
  middleware: customMiddleware,
});
