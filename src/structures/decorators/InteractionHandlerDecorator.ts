import { INTERACTION_PARAMETER_INDEX_KEY, INTERACTION_RUN_METHOD_KEY } from "./Constants";

// Method
export function Run<T>(target: Object, propertyKey: string | symbol, propertyDescriptor: TypedPropertyDescriptor<T>) {
    Reflect.defineMetadata(INTERACTION_RUN_METHOD_KEY, propertyKey, target.constructor);
}

// Injection
export function Interaction(target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
    const constructor = target.constructor;

    Reflect.defineMetadata(INTERACTION_PARAMETER_INDEX_KEY, parameterIndex, constructor);
}