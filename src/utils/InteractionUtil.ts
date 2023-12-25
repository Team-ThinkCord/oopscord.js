import { ButtonStyle } from "discord.js";
import { InteractionButtonOptions, LinkButtonOptions } from "../structures/decorators/MessageComponentDecorator";

export class InteractionUtil {
    static isInteractionButtonOptions(options: InteractionButtonOptions | LinkButtonOptions): options is InteractionButtonOptions {
        return options.style != ButtonStyle.Link;
    }
}