from models.categories import CategoryConfig


def build_messages(
    user_input: str,
    category_config: CategoryConfig,
    few_shot_examples: list[dict] | None = None,
) -> list[dict]:
    messages: list[dict] = [
        {"role": "system", "content": category_config.system_prompt}
    ]

    if few_shot_examples:
        for example in few_shot_examples[:3]:
            messages.append({"role": "user", "content": example["input"]})
            messages.append({"role": "assistant", "content": example["output"]})

    messages.append({"role": "user", "content": user_input})
    return messages


def build_tool_variants_prompt(base_prompt: str, category: str) -> str:
    return (
        f"Given this base prompt:\n{base_prompt}\n\n"
        "Generate optimized variants for:\n"
        "1. Midjourney (add --ar 16:9 --stylize 750 --v 6.1 parameters)\n"
        "2. DALL-E 3 (natural language, no special syntax)\n"
        "3. Stable Diffusion (comma-separated tags, add quality tokens)\n\n"
        "Return JSON only: {\"midjourney\": \"...\", \"dalle\": \"...\", \"stable_diffusion\": \"...\"}"
    )
