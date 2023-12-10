import { INTERACTION_PARAMETER_INDEX_KEY, INTERACTION_RUN_METHOD_KEY } from "./Constants";

// Method
export function Run<T>(target: Object, propertyKey: string | symbol, propertyDescriptor: TypedPropertyDescriptor<T>) {
    Reflect.defineMetadata(INTERACTION_RUN_METHOD_KEY, propertyKey, target.constructor);
}

// Injection
export function Interaction(target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
    const constructor = target; // 이게 클래스


    /*
        @대충 데코레이터
        class NameCommand {
            constructor(
                @Interaction itr: ChatInputCommandInteraction
            ) {}

            @Run
            run() {
                itr.reply("와샍주");
            }
        }

        끝
    */

    Reflect.defineMetadata(INTERACTION_PARAMETER_INDEX_KEY, parameterIndex, constructor);
} // npm에 퍼블리시 하고 테스트해봐야