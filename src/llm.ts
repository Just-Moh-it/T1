import { voiceManager } from "@/index";
import { openai } from "@/lib/openai";
import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
} from "openai/resources/index.mjs";
import {
  ChatCompletionFunctionCallOption,
  ChatCompletionMessageToolCall,
} from "openai/src/resources/index.js";

export type InitialResponse = {
  isFunctionCall: boolean;
};

export async function* functionCallOrTextStream({
  messages,
  onFinishDueToStop,
  onGottenTypeOfResponse,
}: {
  messages: ChatCompletionMessageParam[];
  onFinishDueToStop?: (newMessage: ChatCompletionMessage) => void;
  onGottenTypeOfResponse?: (role: "assistant" | "function_call") => void;
}) {
  const stream = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: messages,
    stream: true,
    functions: [
      {
        name: "takePicture",
        description:
          "Take a picture to see what's in front and get more context. In case the user query sounds like it is missing a lot of context, or if they're asking about a place but haven't mentioned it or haven't even asked for a picture of it explicitly, they probably want you to take a picture",
        // parameters: {
        //   type: "object",
        //   properties: {
        //     city: { type: "string" },
        //   },
        // },
      },
      {
        name: "clearChat",
        description:
          "Clears the chat history so a new thread could be started. In other words, start over the conversation from scratch.",
      },
      {
        name: "changeVoice",
        description: `As a speaking assistant, you have the ability to change voice. Whenever the user asks you to change your voice, pick from a few options: \n${voiceManager.getOptionsStringForLlm()}`,
        parameters: {
          type: "object",
          properties: {
            voice: { type: "string" },
          },
        },
      },
    ],
  });

  let functionCall: ChatCompletionMessageToolCall.Function = {
    name: "",
    arguments: "",
  };
  let isFirstChunk = true;
  let streamingContentOutput = "";

  for await (const chunk of stream) {
    if (!("choices" in chunk)) {
      onFinishDueToStop?.({
        role: "assistant",
        content: "Sorry, there was an error. Please try again",
      });
      yield "An error occurred while generating a response";
      break;
    }

    const message = chunk.choices[0];
    const delta = message?.delta;

    if (typeof delta?.content === "string") {
      if (isFirstChunk) {
        onGottenTypeOfResponse?.("assistant");
        isFirstChunk = false;
      }

      console.log("Yielding text:", delta.content); // Debug log

      streamingContentOutput += delta.content;
      yield delta.content;
    } else if (delta?.function_call) {
      if (isFirstChunk) {
        onGottenTypeOfResponse?.("function_call");
        isFirstChunk = false;
      }

      if (delta.function_call?.name) {
        functionCall.name += delta.function_call.name;
      }
      if (delta.function_call?.arguments) {
        functionCall.arguments += delta.function_call.arguments;
      }
    }

    if (message?.finish_reason === "stop")
      onFinishDueToStop?.({
        role: "assistant",
        content: streamingContentOutput,
      });
    else if (message?.finish_reason === "function_call") yield functionCall;
  }
}
