import { ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder } from "discord.js";
import { MODAL_COMPONENTS_KEY, MODAL_OPTIONS_KEY, ModalComponentBuilder, ModalOptions } from "..";

export class BaseModal {
    static modal: ModalBuilder | null = null;

    static getModal() {
        if (this.modal) return this.modal;

        const modal = new ModalBuilder();
        const options = Reflect.getMetadata(MODAL_OPTIONS_KEY, this) as ModalOptions;
        const components = Reflect.getMetadata(MODAL_COMPONENTS_KEY, this) as ModalComponentBuilder[] ?? [];

        if (!options) throw new TypeError("Failed to get the modal.");

        // Reverse the components because they are added to the modal in reverse order due to the way the decorators work.
        const reversedComponents = [...components].reverse();

        modal
            .setTitle(options.title)
            .setCustomId(options.customId);

        modal.components.push(...reversedComponents);

        this.modal = modal;

        return modal;
    }

    static withDefaultValues(...values: { customId: string, value: string }[]) {
        const modal = ModalBuilder.from(this.getModal().toJSON());

        modal.components.push(...modal.components.map(row => {
            if (row instanceof ActionRowBuilder) {
                const actionRow = ActionRowBuilder.from<ModalActionRowComponentBuilder>(row);

                actionRow.setComponents(actionRow.components.map(component => {
                    if (component instanceof TextInputBuilder) {
                        const matchingValue = values.find(v => v.customId === component.data.custom_id);

                        if (matchingValue) {
                            if ("value" in component.data) {
                                const updatedComponent = TextInputBuilder.from(component.toJSON());
                                updatedComponent.setValue(matchingValue.value);
                                return updatedComponent;
                            }
                        }
                    }
                    return component;
                }));

                return actionRow;
            }

            return row;
        }));

        return modal;
    }
}