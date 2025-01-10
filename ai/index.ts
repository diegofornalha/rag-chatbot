import { groq } from "@ai-sdk/groq";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";
import { customMiddleware } from "./custom-middleware";

export const customModel = wrapLanguageModel({
  model: groq("mixtral-8x7b-32768"),
  middleware: customMiddleware,
});
