import { ButtonStyle, EmojiResolvable, UserSelectMenuBuilder } from "discord.js";
import { BUTTON_OPTIONS_KEY } from ".";

export type InteractionButtonOptions = { customId: string, label?: string, emoji?: EmojiResolvable, style: Exclude<ButtonStyle, ButtonStyle.Link> }
export type LinkButtonOptions = { label?: string, emoji?: EmojiResolvable, style: ButtonStyle.Link, url: string }

export function Button(options: InteractionButtonOptions | LinkButtonOptions) {
    return function<T extends Function>(constructor: T) {
        Reflect.defineMetadata(BUTTON_OPTIONS_KEY, options, constructor);
    }
}