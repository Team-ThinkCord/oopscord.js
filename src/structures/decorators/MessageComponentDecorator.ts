import { ChannelSelectMenuBuilder, ComponentEmojiResolvable, FileUploadBuilder, LabelBuilder, MentionableSelectMenuBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, TextDisplayBuilder, TextInputBuilder, UserSelectMenuBuilder } from "discord.js";
import { ButtonStyle, ChannelType, TextInputStyle } from "discord-api-types/v10";
import { BUTTON_OPTIONS_KEY, INTERACTION_TYPE_KEY, MESSAGE_COMPONENT_MODULE_COMPONENTS_KEY, MODAL_COMPONENTS_KEY, MODAL_TEXT_INPUT_VALUE_INDEX_KEY, MODAL_OPTIONS_KEY, MODULE_TYPE_KEY, ModuleType, SELECT_MENU_OPTIONS_KEY, SELECT_MENU_TYPE_KEY, MODAL_SELECT_MENU_VALUE_INDEX_KEY, MODAL_FILE_UPLOAD_VALUE_INDEX_KEY } from ".";
import { InteractionType } from "../Constants";

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

export type ButtonOptions = InteractionButtonOptions | LinkButtonOptions | PremiumButtonOptions;
export type MessageComponentModuleOptions = { components: (new (...args: any[]) => any)[] }
export type InteractionButtonOptions = { customId: string, disabled?: boolean, label?: string, emoji?: ComponentEmojiResolvable, style: Exclude<Exclude<ButtonStyle, ButtonStyle.Link>, ButtonStyle.Premium> }
export type LinkButtonOptions = { label?: string, disabled?: boolean, emoji?: ComponentEmojiResolvable, style: ButtonStyle.Link, url: string }
export type PremiumButtonOptions = { style: ButtonStyle.Premium, disabled?: boolean, skuId: string }

export type BaseSelectMenuOptions = { customId: string, placeholder?: string, disabled?: boolean, minValues?: number, maxValues?: number }
export type StringSelectMenuOptions = BaseSelectMenuOptions & { options: { label: string, value: string, description?: string, emoji?: ComponentEmojiResolvable }[] }
export type UserSelectMenuOptions = BaseSelectMenuOptions & { defaultUsers?: string[] }
export type ChannelSelectMenuOptions = BaseSelectMenuOptions & { defaultChannels?: string[], channelTypes?: ChannelType[] }
export type RoleSelectMenuOptions = BaseSelectMenuOptions & { defaultRoles?: string[] }
export type MentionableSelectMenuOptions = BaseSelectMenuOptions & { defaultUsers?: string[], defaultRoles?: string[] }

export type ModalLabelComponentData = { customId: string, component: LabelBuilder, outerType: "label", innerType: "string_select" | "user_select" | "channel_select" | "role_select" | "mentionable_select" | "text_input" | "file_upload" }
export type ModalTextDisplayComponentData = { customId: string, component: TextDisplayBuilder, outerType: "text_display" }
export type ModalComponentData = ModalLabelComponentData | ModalTextDisplayComponentData;
export type ModalOptions = { customId: string, title: string }
export type ModalTextInput = { type: "text_input", customId: string, style: TextInputStyle, placeholder?: string, value?: string, required?: boolean, minLength?: number, maxLength?: number }
export type ModalStringSelect = StringSelectMenuOptions & { type: "string_select" }
export type ModalUserSelect = UserSelectMenuOptions & { type: "user_select" }
export type ModalChannelSelect = ChannelSelectMenuOptions & { type: "channel_select" }
export type ModalRoleSelect = RoleSelectMenuOptions & { type: "role_select" }
export type ModalMentionableSelect = MentionableSelectMenuOptions & { type: "mentionable_select" }
export type ModalFileUploadOptions = { type: "file_upload", customId: string, minValues?: number, maxValues?: number, required?: boolean }
export type ModalTextDisplayOptions = { customId: string, content: string }
export type ModalLabelOptions = { customId: string, label: string, description?: string, component: ModalLabelComponent }

export type ModalComponentBuilder = LabelBuilder | TextDisplayBuilder;

type ModalComponentBase =
  | ModalTextInput
  | ModalFileUploadOptions
  | ModalStringSelect
  | ModalUserSelect
  | ModalChannelSelect
  | ModalRoleSelect
  | ModalMentionableSelect;

export type ModalLabelComponent = DistributiveOmit<ModalComponentBase & { required?: boolean, disabled?: never }, "disabled">;

export type FieldIndex = { index: number, customId: string }
export type TextInputFieldIndex = FieldIndex & { type: "text_input" }
export type SelectMenuFieldIndex = FieldIndex & { type: "select_menu" }
export type FileUploadFieldIndex = FieldIndex & { type: "file_upload" }

export type ModalFieldIndex = TextInputFieldIndex | SelectMenuFieldIndex | FileUploadFieldIndex;

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

export function ModalLabel(options: ModalLabelOptions) {
    return function<T extends Function>(constructor: T) {
        const components = Reflect.getMetadata(MODAL_COMPONENTS_KEY, constructor) as ModalComponentData[] ?? [];

        const label = new LabelBuilder();

        label.setLabel(options.label);
        if (options.description) label.setDescription(options.description);

        const component = options.component;
        
        switch (component.type) {
            case "text_input":
                const textInput = new TextInputBuilder()
                    .setCustomId(component.customId)
                    .setStyle(component.style);

                if ("placeholder" in component) textInput.setPlaceholder(component.placeholder!);
                if ("value" in component) textInput.setValue(component.value!);
                if ("minLength" in component) textInput.setMinLength(component.minLength!);
                if ("maxLength" in component) textInput.setMaxLength(component.maxLength!);
                if ("required" in component) textInput.setRequired(component.required!);

                label.setTextInputComponent(textInput);

                break;
            case "string_select":
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(component.customId)
                    .addOptions(component.options);
                
                if (component.placeholder) selectMenu.setPlaceholder(component.placeholder);
                if (typeof component.minValues == "number") selectMenu.setMinValues(component.minValues);
                if (typeof component.maxValues == "number") selectMenu.setMaxValues(component.maxValues);
                if ("required" in component) selectMenu.setRequired(component.required!);

                label.setStringSelectMenuComponent(selectMenu);

                break;
            case "user_select":
                const userSelectMenu = new UserSelectMenuBuilder()
                    .setCustomId(component.customId);
                
                if (component.placeholder) userSelectMenu.setPlaceholder(component.placeholder);
                if (typeof component.minValues == "number") userSelectMenu.setMinValues(component.minValues);
                if (typeof component.maxValues == "number") userSelectMenu.setMaxValues(component.maxValues);
                if (component && component.defaultUsers) userSelectMenu.setDefaultUsers(component.defaultUsers!);
                if ("required" in component) userSelectMenu.setRequired(component.required!);

                label.setUserSelectMenuComponent(userSelectMenu);

                break;
            case "channel_select":
                const channelSelectMenu = new ChannelSelectMenuBuilder()
                    .setCustomId(component.customId);

                if (component.placeholder) channelSelectMenu.setPlaceholder(component.placeholder); 
                if (typeof component.minValues == "number") channelSelectMenu.setMinValues(component.minValues);
                if (typeof component.maxValues == "number") channelSelectMenu.setMaxValues(component.maxValues);
                if (component && component.defaultChannels) channelSelectMenu.setDefaultChannels(component.defaultChannels!);
                if (component.channelTypes) channelSelectMenu.setChannelTypes(component.channelTypes);
                if ("required" in component) channelSelectMenu.setRequired(component.required!);

                label.setChannelSelectMenuComponent(channelSelectMenu);

                break;
            case "role_select":
                const roleSelectMenu = new RoleSelectMenuBuilder()
                    .setCustomId(component.customId);

                if (component.placeholder) roleSelectMenu.setPlaceholder(component.placeholder);
                if (typeof component.minValues == "number") roleSelectMenu.setMinValues(component.minValues);
                if (typeof component.maxValues == "number") roleSelectMenu.setMaxValues(component.maxValues);
                if (component && component.defaultRoles) roleSelectMenu.setDefaultRoles(component.defaultRoles!);
                if ("required" in component) roleSelectMenu.setRequired(component.required!);

                label.setRoleSelectMenuComponent(roleSelectMenu);

                break;
            case "mentionable_select":
                const mentionableSelectMenu = new MentionableSelectMenuBuilder()
                    .setCustomId(component.customId);

                if (component.placeholder) mentionableSelectMenu.setPlaceholder(component.placeholder);
                if (typeof component.minValues == "number") mentionableSelectMenu.setMinValues(component.minValues);
                if (typeof component.maxValues == "number") mentionableSelectMenu.setMaxValues(component.maxValues);
                if (component && component.defaultUsers) mentionableSelectMenu.addDefaultUsers(component.defaultUsers!);
                if (component && component.defaultRoles) mentionableSelectMenu.addDefaultRoles(component.defaultRoles!);
                if ("required" in component) mentionableSelectMenu.setRequired(component.required!);

                label.setMentionableSelectMenuComponent(mentionableSelectMenu);

                break;
            case "file_upload":
                const fileUpload = new FileUploadBuilder()
                    .setCustomId(component.customId)
                    .setMinValues(component.minValues ?? 1)
                    .setMaxValues(component.maxValues ?? 1);

                if ("required" in component) fileUpload.setRequired(component.required!);

                label.setFileUploadComponent(fileUpload);
        }

        components.push({ customId: component.customId, component: label, outerType: "label", innerType: component.type });

        Reflect.defineMetadata(MODAL_COMPONENTS_KEY, components, constructor);
    }
}

export function ModalTextDisplay(options: ModalTextDisplayOptions) {
    return function<T extends Function>(constructor: T) {
        const components = Reflect.getMetadata(MODAL_COMPONENTS_KEY, constructor) as ModalComponentData[] ?? [];

        const textDisplay = new TextDisplayBuilder()
            .setContent(options.content);

        components.push({ customId: options.customId, component: textDisplay, outerType: "text_display" });

        Reflect.defineMetadata(MODAL_COMPONENTS_KEY, components, constructor);
    }
}

export function TextInputFieldInjection(customId: string) {
    return function (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const fields = Reflect.getMetadata(MODAL_TEXT_INPUT_VALUE_INDEX_KEY, target) as ModalFieldIndex[] ?? [];

        fields.push({ index: parameterIndex, customId, type: "text_input" });

        Reflect.defineMetadata(MODAL_TEXT_INPUT_VALUE_INDEX_KEY, fields, target);
    }
}

export function SelectMenuFieldInjection(customId: string) {
    return function (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const fields = Reflect.getMetadata(MODAL_SELECT_MENU_VALUE_INDEX_KEY, target) as ModalFieldIndex[] ?? [];

        fields.push({ index: parameterIndex, customId, type: "select_menu" });

        Reflect.defineMetadata(MODAL_SELECT_MENU_VALUE_INDEX_KEY, fields, target);
    }
}

export function FileUploadFieldInjection(customId: string) {
    return function (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const fields = Reflect.getMetadata(MODAL_FILE_UPLOAD_VALUE_INDEX_KEY, target) as ModalFieldIndex[] ?? [];

        fields.push({ index: parameterIndex, customId, type: "file_upload" });

        Reflect.defineMetadata(MODAL_FILE_UPLOAD_VALUE_INDEX_KEY, fields, target);
    }
}