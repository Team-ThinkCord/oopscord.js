import { ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder } from "discord.js";
import { MODAL_COMPONENTS_KEY, MODAL_OPTIONS_KEY, ModalOptions } from "..";

export class BaseModal {
    static modal: ModalBuilder | null = null;

    static getModal() {
        if (this.modal) return this.modal;

        const modal = new ModalBuilder();
        const options = Reflect.getMetadata(MODAL_OPTIONS_KEY, this) as ModalOptions;
        const components = Reflect.getMetadata(MODAL_COMPONENTS_KEY, this) as ModalActionRowComponentBuilder[] ?? [];

        if (!options) throw new TypeError("Failed to get the modal.");

        modal
            .setTitle(options.title)
            .setCustomId(options.customId);

        modal.setComponents(new ActionRowBuilder(...components.map(c => c.toJSON())));

        this.modal = modal;

        return modal;
    }

    static withDefaultValues(...values: { customId: string, value: string }[]) {
        const modal = ModalBuilder.from(this.getModal().toJSON());

        modal.setComponents(modal.components.map(c =>
            c.setComponents(c.components.map(input => {
                const value = values.find(v => v.customId == input.data.custom_id);
                if (value) input.setValue(value.value);

                return input;
            }))
        ));

        return modal;
    }
}