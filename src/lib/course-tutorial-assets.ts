import beginnerCh2ChatgptPromptingAsset from "@/assets/tutorials/beginner-ch2-chatgpt-prompting.gif.asset.json";
import beginnerCh4WeakVsStrongImagePromptAsset from "@/assets/tutorials/beginner-ch4-weak-vs-strong-image-prompt.gif.asset.json";
import beginnerCh8BuildSiteFromPromptAsset from "@/assets/tutorials/beginner-ch8-build-site-from-prompt.gif.asset.json";
import intermediateCh2AutomationTriggerActionAsset from "@/assets/tutorials/intermediate-ch2-automation-trigger-action.gif.asset.json";
import intermediateCh3BuildBusinessChatbotAsset from "@/assets/tutorials/intermediate-ch3-build-business-chatbot.gif.asset.json";
import intermediateCh4DataAnalysisWithAiAsset from "@/assets/tutorials/intermediate-ch4-data-analysis-with-ai.gif.asset.json";
import advancedCh1IdeaToLiveProductAsset from "@/assets/tutorials/advanced-ch1-idea-to-live-product.gif.asset.json";
import advancedCh2CallingApiDirectlyAsset from "@/assets/tutorials/advanced-ch2-calling-api-directly.gif.asset.json";
import advancedCh7AiAssistedCodingAsset from "@/assets/tutorials/advanced-ch7-ai-assisted-coding.gif.asset.json";

export const BEGINNER_TUTORIAL_GIFS = {
  2: beginnerCh2ChatgptPromptingAsset.url,
  4: beginnerCh4WeakVsStrongImagePromptAsset.url,
  8: beginnerCh8BuildSiteFromPromptAsset.url,
} as const;

export const INTERMEDIATE_TUTORIAL_GIFS = {
  2: intermediateCh2AutomationTriggerActionAsset.url,
  3: intermediateCh3BuildBusinessChatbotAsset.url,
  4: intermediateCh4DataAnalysisWithAiAsset.url,
} as const;

export const ADVANCED_TUTORIAL_GIFS = {
  1: advancedCh1IdeaToLiveProductAsset.url,
  2: advancedCh2CallingApiDirectlyAsset.url,
  7: advancedCh7AiAssistedCodingAsset.url,
} as const;