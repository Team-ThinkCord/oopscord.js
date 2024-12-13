import { ButtonBuilder, ButtonStyle } from "discord.js";
import { BUTTON_OPTIONS_KEY, ButtonOptions } from "..";

export class BaseButton {
    static button: ButtonBuilder | null = null;

    static getButton() {
        if (this.button) return this.button;

        const button = new ButtonBuilder();
        const options = Reflect.getMetadata(BUTTON_OPTIONS_KEY, this) as ButtonOptions;

        if (!options) throw new TypeError("Failed to get the button.");

        if (options.style == ButtonStyle.Premium) {
            button
                .setStyle(options.style)
                .setSKUId(options.skuId);

            return button;
        }

        if (options.style == ButtonStyle.Link) {
            button
                .setStyle(options.style)
                .setURL(options.url);
        } else {
            button
                .setStyle(options.style)
                .setCustomId(options.customId);
        }

        if (options.label) button.setLabel(options.label);
        if (options.emoji) button.setEmoji(options.emoji);
        if (options.disabled) button.setDisabled(options.disabled);

        this.button = button;

        return button;
    }
}