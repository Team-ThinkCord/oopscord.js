import { ButtonBuilder, ButtonStyle } from "discord.js";
import { Button, BUTTON_OPTIONS_KEY, ButtonOptions } from "..";
import { Util } from "../../utils/Util";

/**
 * The base class for buttons created with the {@link Button} decorator. This class is used to create a button from the options defined in the class, and to override the default options with new options when creating the button.
 * 
 * @example
 * ```ts
 * import { ButtonInteraction, ButtonStyle } from "discord.js";
 * import { Button, BaseButton, Interaction, Run } from "oopscord.js";
 * 
 * ＠Button({
 *     customId: "my_button",
 *     label: "Click me!",
 *     style: ButtonStyle.Primary
 * })
 * class MyButton extends BaseButton {
 *     constructor(＠Interaction readonly interaction: ButtonInteraction) {
 *         super();
 *     }
 *     
 *     ＠Run
 *     async run() {
 *         await this.interaction.reply("You clicked the button!");
 *     }
 * }
 * ```
 */
export class BaseButton {
    private static options: ButtonOptions;
    private static button: ButtonBuilder | null = null;

    /** Returns {@link ButtonBuilder} that was created from the button options. */
    static getButton() {
        if (this.button) return this.button;

        const options = Reflect.getMetadata(BUTTON_OPTIONS_KEY, this) as ButtonOptions;

        if (!options) throw new TypeError("Failed to get the button.");

        this.options = options;

        const button = create(options);

        this.button = button;

        // Return a copy of the button to prevent accidental mutations to the original button stored in the class.
        return ButtonBuilder.from(button.toJSON());
    }

    /**
     * Returns a new {@link ButtonBuilder} with the specified options merged with the default options defined in the class.
     * 
     * @param options The options to merge with the default options.
     */
    static override<T extends ButtonOptions>(options: Partial<T>) {
        const currentOptions = this.options ?? Reflect.getMetadata(BUTTON_OPTIONS_KEY, this) as T;

        if (!currentOptions) throw new TypeError("Failed to get the button options.");

        const newOptions = Util.mergeDefault(currentOptions, options);

        return create(newOptions);
    }
}

function create(options: ButtonOptions) {
    const button = new ButtonBuilder();

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

    return button;
}