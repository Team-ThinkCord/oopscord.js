import { ComponentEmojiResolvable, ModalActionRowComponentBuilder, StringSelectMenuBuilder, TextInputBuilder } from "discord.js";
import { ButtonStyle, TextInputStyle } from "discord-api-types/v10";
import { BUTTON_OPTIONS_KEY, INTERACTION_TYPE_KEY, MESSAGE_COMPONENT_MODULE_COMPONENTS_KEY, MODAL_COMPONENTS_KEY, MODAL_FIELD_INDEX_KEY, MODAL_OPTIONS_KEY, MODULE_TYPE_KEY, ModuleType, SELECT_MENU_OPTIONS_KEY, SELECT_MENU_TYPE_KEY } from ".";
import { InteractionType } from "../Constants";

export type ButtonOptions = InteractionButtonOptions | LinkButtonOptions | PremiumButtonOptions;
export type MessageComponentModuleOptions = { components: (new (...args: any[]) => any)[] }
export type InteractionButtonOptions = { customId: string, disabled?: boolean, label?: string, emoji?: ComponentEmojiResolvable, style: Exclude<Exclude<ButtonStyle, ButtonStyle.Link>, ButtonStyle.Premium> }
export type LinkButtonOptions = { label?: string, disabled?: boolean, emoji?: ComponentEmojiResolvable, style: ButtonStyle.Link, url: string }
export type PremiumButtonOptions = { style: ButtonStyle.Premium, disabled?: boolean, skuId: string }

export type BaseSelectMenuOptions = { customId: string, placeholder: string, disabled?: boolean, minValues?: number, maxValues?: number }
export type StringSelectMenuOptions = BaseSelectMenuOptions & { options: { label: string, value: string, description?: string, emoji?: ComponentEmojiResolvable }[] }
export type UserSelectMenuOptions = BaseSelectMenuOptions & { defaultUsers?: string[] }
export type ChannelSelectMenuOptions = BaseSelectMenuOptions & { defaultChannels?: string[] }
export type RoleSelectMenuOptions = BaseSelectMenuOptions & { defaultRoles?: string[] }
export type MentionableSelectMenuOptions = BaseSelectMenuOptions & { defaultUsers?: string[], defaultRoles?: string[] }

export type ModalOptions = { customId: string, title: string }
export type TextInputOptions = { customId: string, label: string, style: TextInputStyle, placeholder?: string, value?: string, required?: boolean, minLength?: number, maxLength?: number }
export type FieldIndex = { index: number, customId: string }

export function MessageComponentModule(options: MessageComponentModuleOptions) {
    return function<T extends Function>(constructor: T) {
        Reflect.defineMetadata(MODULE_TYPE_KEY, ModuleType.MESSAGE_COMPONENT, constructor);
        Reflect.defineMetadata(MESSAGE_COMPONENT_MODULE_COMPONENTS_KEY, options.components, constructor);
    }
}

export function Button(options: InteractionButtonOptions | LinkButtonOptions) {
    return function<T extends Function>(constructor: T) {
        Reflect.defineMetadata(INTERACTION_TYPE_KEY, InteractionType.BUTTON, constructor);
        Reflect.defineMetadata(BUTTON_OPTIONS_KEY, options, constructor);
    }
}

export function StringSelectMenu(options: StringSelectMenuOptions) {
    return function<T extends Function>(constructor: T) {
        Reflect.defineMetadata(INTERACTION_TYPE_KEY, InteractionType.SELECT_MENU, constructor);
        Reflect.defineMetadata(SELECT_MENU_TYPE_KEY, "string", constructor);
        Reflect.defineMetadata(SELECT_MENU_OPTIONS_KEY, options, constructor);
    }
}

export function UserSelectMenu(options: UserSelectMenuOptions) {
    return function<T extends Function>(constructor: T) {
        Reflect.defineMetadata(INTERACTION_TYPE_KEY, InteractionType.SELECT_MENU, constructor);
        Reflect.defineMetadata(SELECT_MENU_TYPE_KEY, "user", constructor);
        Reflect.defineMetadata(SELECT_MENU_OPTIONS_KEY, options, constructor);
    }
}

export function ChannelSelectMenu(options: ChannelSelectMenuOptions) {
    return function<T extends Function>(constructor: T) {
        Reflect.defineMetadata(INTERACTION_TYPE_KEY, InteractionType.SELECT_MENU, constructor);
        Reflect.defineMetadata(SELECT_MENU_TYPE_KEY, "channel", constructor);
        Reflect.defineMetadata(SELECT_MENU_OPTIONS_KEY, options, constructor);
    }
}

export function RoleSelectMenu(options: RoleSelectMenuOptions) {
    return function<T extends Function>(constructor: T) {
        Reflect.defineMetadata(INTERACTION_TYPE_KEY, InteractionType.SELECT_MENU, constructor);
        Reflect.defineMetadata(SELECT_MENU_TYPE_KEY, "role", constructor);
        Reflect.defineMetadata(SELECT_MENU_OPTIONS_KEY, options, constructor);
    }
}

export function MentionableSelectMenu(options: MentionableSelectMenuOptions) {
    return function<T extends Function>(constructor: T) {
        Reflect.defineMetadata(INTERACTION_TYPE_KEY, InteractionType.SELECT_MENU, constructor);
        Reflect.defineMetadata(SELECT_MENU_TYPE_KEY, "mentionable", constructor);
        Reflect.defineMetadata(SELECT_MENU_OPTIONS_KEY, options, constructor);
    }
}

export function Modal(options: ModalOptions) {
    return function<T extends Function>(constructor: T) {
        Reflect.defineMetadata(INTERACTION_TYPE_KEY, InteractionType.MODAL_SUBMIT, constructor);
        Reflect.defineMetadata(MODAL_OPTIONS_KEY, options, constructor);
    }
}

export function TextInput(options: TextInputOptions) {
    return function<T extends Function>(constructor: T) {
        const components = Reflect.getMetadata(MODAL_COMPONENTS_KEY, constructor) as ModalActionRowComponentBuilder[] ?? [];

        const component = new TextInputBuilder()
            .setCustomId(options.customId)
            .setLabel(options.label)
            .setStyle(options.style);

        if (options.placeholder) component.setPlaceholder(options.placeholder);
        if (options.value) component.setValue(options.value);
        if (options.required) component.setRequired(options.required);
        if (typeof options.minLength == 'number') component.setMinLength(options.minLength);
        if (typeof options.maxLength == 'number') component.setMaxLength(options.maxLength);

        components.push(component);

        Reflect.defineMetadata(MODAL_COMPONENTS_KEY, components, constructor);
    }
}

export function TextInputFieldInjection(customId: string) {
    return function (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const fields = Reflect.getMetadata(MODAL_FIELD_INDEX_KEY, target) as FieldIndex[] ?? [];

        fields.push({ index: parameterIndex, customId });

        Reflect.defineMetadata(MODAL_FIELD_INDEX_KEY, fields, target);
    }
}