import { ActionRowBuilder, CheckboxBuilder, CheckboxGroupBuilder, Interaction, LabelBuilder, ModalActionRowComponentBuilder, ModalBuilder, ModalSubmitFields, ModalSubmitInteraction, RadioGroupBuilder, RepliableInteraction, StringSelectMenuBuilder, TextDisplayBuilder, TextInputBuilder } from "discord.js";
import { MODAL_COMPONENTS_KEY, MODAL_OPTIONS_KEY, ModalComponentBuilder, ModalComponentData, ModalOptions } from "..";
import crypto from "node:crypto";
import { Util } from "../../utils/Util";

export type LabelValueOverride = { type: 'label', customId: string, label?: string, description?: string }
export type TextDisplayValueOverride = { type: 'text_display', customId: string, content: string }
export type StringSelectValueOverride = { type: 'string_select', customId: string, options: { label: string, value: string, description?: string, emoji?: string }[] }
export type RadioGroupValueOverride = { type: 'radio_group', customId: string, required?: boolean, options: { label: string, value: string, description?: string, default?: boolean }[] }
export type CheckboxGroupValueOverride = { type: 'checkbox_group', customId: string, minValues?: number, maxValues?: number, required?: boolean, options: { label: string, value: string, description?: string, default?: boolean }[] }
export type CheckboxValueOverride = { type: 'checkbox', customId: string, default?: boolean }
export type TextInputValueOverride = { type: 'text_input', customId: string, value: string };
export type ModalValueOverride = StringSelectValueOverride | TextInputValueOverride | LabelValueOverride | TextDisplayValueOverride | RadioGroupValueOverride | CheckboxGroupValueOverride | CheckboxValueOverride;

/**
 * The base class for modals created with the {@link Modal} decorator. This class is used to create a modal from the options and components defined in the class, and to override the default options and component values with new options and values when creating the modal.
 * 
 * @example
 * ```ts
 * import { ModalSubmitInteraction } from "discord.js";
 * import { Modal, BaseModal, Interaction, Run } from "oopscord.js";
 * 
 * ＠Modal({
 *     customId: "my_modal",
 *     title: "My Modal"
 * })
 * ＠ModalLabel({
 *     customId: "my_label",
 *     label: "This is a label",
 *     component: { type: "text_input", customId: "my_text_input", style: TextInputStyle.Short, placeholder: "Enter something...", required: true }
 * })
 * class MyModal extends BaseModal {
 *     constructor(＠Interaction readonly interaction: ModalSubmitInteraction, ＠TextInputFieldInjection("my_text_input") readonly textInputValue: string) {
 *        super();
 *     }
 * 
 *     ＠Run
 *     async run() {
 *         await this.interaction.reply(`You entered: ${this.textInputValue}`);
 *     }
 * }
 * ```
 */
export class BaseModal {
    private static modal: ModalBuilder | null = null;
    private static options: ModalOptions;
    private static components: ModalComponentData[] = [];

    /** Returns a new {@link ModalBuilder} that was created from the modal options and components. */
    static getModal() {
        if (this.modal) return ModalBuilder.from(this.modal.toJSON());

        const options = Reflect.getMetadata(MODAL_OPTIONS_KEY, this) as ModalOptions;
        const components = Reflect.getMetadata(MODAL_COMPONENTS_KEY, this) as ModalComponentData[] ?? [];

        if (!options || !components) throw new TypeError("Failed to get the modal.");

        // Reverse the components because they are added to the modal in reverse order due to the way the decorators work.
        const reversedComponents = [ ...components ].reverse();

        this.options = options;
        this.components = [ ... reversedComponents ];

        this.modal = create(options, reversedComponents.map(c => c.component));

        return ModalBuilder.from(this.modal.toJSON());
    }

    /**
     * Returns a new {@link ModalBuilder} with the specified options and component values merged with the default options and components defined in the class.
     * 
     * @param options The options to merge with the default options.
     * @param values The component values to merge with the default components. The `customId` property is used to match the values with the correct components, and the `type` property is used to determine which type of component the value is for.
     */
    static override(options: Partial<ModalOptions> = {}, ...values: ModalValueOverride[]) {
        const currentOptions = this.options ?? Reflect.getMetadata(MODAL_OPTIONS_KEY, this) as ModalOptions;
        const currentComponents = this.components.length > 0 ? this.components : (Reflect.getMetadata(MODAL_COMPONENTS_KEY, this) as ModalComponentData[])?.reverse();

        if (!currentOptions) throw new TypeError("Failed to get the modal options.");

        const newOptions = Util.mergeDefault(currentOptions, options);
        const newComponents = currentComponents.map(c => {
            const { customId, component } = c;

            if (component instanceof LabelBuilder) {
                const updatedComponent = new LabelBuilder(component.toJSON());

                const matchingLabelValue = values.find(v => v.customId === customId && v.type === 'label') as LabelValueOverride;

                if (matchingLabelValue) {
                    if (matchingLabelValue.label) updatedComponent.setLabel(matchingLabelValue.label);
                    if (matchingLabelValue.description) updatedComponent.setDescription(matchingLabelValue.description);
                }

                if (component.data.component instanceof TextInputBuilder) {
                    const matchingTextInputValue = values.find(v => v.customId === component.data.component!.data.custom_id && v.type === 'text_input') as TextInputValueOverride;

                    if (matchingTextInputValue) {
                        if ("value" in component.data.component.data) {
                            const updatedTextInput = TextInputBuilder.from(component.data.component.toJSON());

                            updatedTextInput.setValue(matchingTextInputValue.value);

                            updatedComponent.setTextInputComponent(updatedTextInput);
                        }
                    }
                } else if (component.data.component instanceof StringSelectMenuBuilder) {
                    const matchingStringSelectValue = values.find(v => v.customId === component.data.component!.data.custom_id && v.type === 'string_select') as StringSelectValueOverride;

                    if (matchingStringSelectValue) {
                        const updatedComponent = StringSelectMenuBuilder.from(component.data.component.toJSON());

                        updatedComponent.setOptions(matchingStringSelectValue.options);

                        component.setStringSelectMenuComponent(updatedComponent);
                    }
                } else if (component.data.component instanceof RadioGroupBuilder) {
                    const matchingRadioGroupValue = values.find(v => v.customId === component.data.component!.data.custom_id && v.type === 'radio_group') as RadioGroupValueOverride;

                    if (matchingRadioGroupValue) {
                        const updatedComponent = new RadioGroupBuilder(component.data.component.toJSON());

                        if ("required" in matchingRadioGroupValue) updatedComponent.setRequired(matchingRadioGroupValue.required!);

                        updatedComponent.setOptions(matchingRadioGroupValue.options);

                        component.setRadioGroupComponent(updatedComponent);
                    }
                } else if (component.data.component instanceof CheckboxGroupBuilder) {
                    const matchingCheckboxGroupValue = values.find(v => v.customId === component.data.component!.data.custom_id && v.type === 'checkbox_group') as CheckboxGroupValueOverride;

                    if (matchingCheckboxGroupValue) {
                        const updatedComponent = new CheckboxGroupBuilder(component.data.component.toJSON());

                        if (typeof matchingCheckboxGroupValue.minValues == "number") updatedComponent.setMinValues(matchingCheckboxGroupValue.minValues);
                        if (typeof matchingCheckboxGroupValue.maxValues == "number") updatedComponent.setMaxValues(matchingCheckboxGroupValue.maxValues);
                        if ("required" in matchingCheckboxGroupValue) updatedComponent.setRequired(matchingCheckboxGroupValue.required!);

                        updatedComponent.setOptions(matchingCheckboxGroupValue.options);

                        component.setCheckboxGroupComponent(updatedComponent);
                    }
                } else if (component.data.component instanceof CheckboxBuilder) {
                    const matchingCheckboxValue = values.find(v => v.customId === component.data.component!.data.custom_id && v.type === 'checkbox') as CheckboxValueOverride;

                    if (matchingCheckboxValue) {
                        const updatedComponent = new CheckboxBuilder(component.data.component.toJSON());

                        if ("default" in matchingCheckboxValue) updatedComponent.setDefault(matchingCheckboxValue.default!);

                        component.setCheckboxComponent(updatedComponent);
                    }
                }

                return { customId, component: updatedComponent };
            } else if (component instanceof TextDisplayBuilder) {
                const updatedComponent = new TextDisplayBuilder(component.toJSON());

                const matchingTextDisplayValue = values.find(v => v.customId === customId && v.type === 'text_display') as TextDisplayValueOverride;

                if (matchingTextDisplayValue) {
                    updatedComponent.setContent(matchingTextDisplayValue.content);
                }

                return { customId, component: updatedComponent };
            }

            return { customId, component };
        });

        const modal = create(newOptions, [ ...newComponents ].map(c => c.component));

        return modal;
    }

    /**
     * Shows modal to user and recieve the input.
     * @param itr The interaction to show the modal to. Must be a command or button interaction.
     * @returns The fields submitted by the user in the modal.
     */
    static getInput(itr: Exclude<RepliableInteraction, ModalSubmitInteraction>) {
        return new Promise<ModalSubmitFields>((r, j) => {
            if (itr.replied || itr.deferred) return j("Interaction already replied.");
            
            const id = crypto.createHash("md5")
                .update(Math.floor(Math.random() * (99999999 - 10000000) + 10000000).toString())
                .digest("hex");

            itr.showModal(this.getModal().setCustomId(id));

            let listener = async (itr: Interaction) => {
                if (!itr.isModalSubmit() || itr.customId != id) return;
                await itr.deferUpdate();

                r(itr.fields);

                itr.client.off("interactionCreate", listener);
            }

            itr.client.on("interactionCreate", listener);

            setTimeout(() => {
                itr.client.off("interactionCreate", listener);

                j("Timed out")
            }, 180 * 1000);
        });
    }
}

function create(options: ModalOptions, components: ModalComponentBuilder[]) {
        const modal = new ModalBuilder()
            .setTitle(options.title)
            .setCustomId(options.customId);

        modal.components.push(...components);

        return modal;
    }