import { Event } from './Event';
import { EventDispatcher } from './EventDispatcher';

type Partial<T> = {
    [Property in keyof InstanceType<T>]?: InstanceType<T>[Property];
};

/**
 * <콤포넌트 클래스>
 * 기능이나 데이터를 개체화해서 관리할 수 있도록 해준다.
 * 콤포넌트는 하위에 콤포넌트를 가질 수 있고 이벤트를 발생시킬 수 있다.
 * 전역적으로 특정 타입의 콤포넌트를 모두 찾는 기능을 제공한다.
 *
 * @export
 * @class Component
 * @extends {EventDispatcher}
 */
export class Component extends EventDispatcher {

    [key: string]: any;

    protected _parentComponent: Component;
    protected _childComponents: Record<string, Component>;
    protected _componentName: string;

    get parentComponent(): Component;

    constructor(): Component;

    /**
     * 콤포넌트를 추가한다.
     * 콤포넌트 이름을 지정하지 않으면 임의로 부여한다.
     *
     * @template T
     * @param {T|object} com 추가할 콤포넌트
     * @param {string} [newComName] 콤포넌트 이름
     * @return {*}  {T}
     * @memberof Component
     */
    addComponent<T extends Component>(com: T | object, newComName?: string): T;

    /**
     * 콤포넌트를 부모 콤포넌트에서 제거한다.
     *
     * @memberof Component
     */
    removeComponentFromParent(): void;

    /**
     * 콤포넌트를 제거한다.
     * 콤포넌트를 지정할 수도 있고 콤포넌트 클래스를 인자로 줘서 삭제할 수도 있다.
     * 클래스를 지정한 경우 해당 클래스 타입의 콤포넌트가 모두 삭제된다.
     *
     * @template T
     * @param {(Component | T)} com
     * @memberof Component
     */
    removeComponent<T extends typeof Component>(com: Component | T);

    /**
     * 하위 콤포넌트 어레이를 반환한다.
     *
     * @readonly
     * @type {Component[]}
     * @memberof Component
     */
    get components(): Component[];

    /**
     * 특정 콤포넌트 타입이 하위에 있는지 체크한다.
     *
     * @template T
     * @param {Component | T} comType 콤포넌트 클래스나 인스턴스
     * @return {boolean}
     * @memberof Component
     */
    hasComponent<T extends typeof Component>(comType: Component | T): boolean;

    /**
     * 콤포넌트 클래스를 인자로 하여 콤포넌트를 1개 반환한다. 
     * 콤포넌트 이름을 지정해서 반환할 수도 있다.
     *
     * @template T
     * @param {T | string} comType 콤포넌트 클래스
     * @return {InstanceType<T>|null}
     * @memberof Component
     */
    getComponent<T extends typeof Component>(comType: T | string): InstanceType<T>;

    /**
     * 콤포넌트 클래스를 인자로 하여 그 클래스의 인스턴스이거나 상속 받은 인스턴스 콤포넌트를 모두 반환한다.
     *
     * @template T
     * @param {T} comType 콤포넌트 클래스
     * @return {InstanceType<T>[]|null}
     * @memberof Component
     */
    getCompatibleComponents<T extends typeof Component>(comType: T): InstanceType<T>[];

    /**
     * 콤포넌트 클래스를 인자로 하여 add된 콤포넌트를 찾아서 가지고 있는 배열을 반환한다.
     * 배열은 WeakRef 개체들이 담겨있으며, 이 배열을 안전하게 사용하려면 복사해서 사용해야 한다.
     * 그렇지 않으면 addComponent가 이 배열에 영향을 줄 수 있다.
     * add된 것만 찾는 것에 주의한다.
     *
     * @static
     * @template T
     * @param {T} comType
     * @return {WeakRef<InstanceType<T>>[]} 콤포넌트의 WeakRef 개체
     * @memberof Component
     */
    static _getAllComponentsNativeArray<T extends typeof Component>(comType: T): WeakRef<InstanceType<T>>[];

    /**
     * 콤포넌트 클래스를 인자로 하여 add된 콤포넌트를 찾아서 모두 반환한다.
     * add된 것만 찾는 것에 주의한다.
     *
     * @static
     * @template T
     * @param {T} comType
     * @return {*}  {InstanceType<T>[]}
     * @memberof Component
     */
    static getAllComponents<T extends typeof Component>(comType: T): InstanceType<T>[];

    /**
     * 이 콤포넌트가 자식으로 인자로 주어진 콤포넌트를 모두 가지고 있는지 체크한다.
     *
     * @param {...typeof Component[]} comTypes
     * @return {boolean}
     * @memberof Component
     */
    hasAllComponents(...comTypes: typeof Component[]): boolean;

    /**
     * 이벤트를 발생시킨다.
     * 하위 콤포넌트에도 모두 같은 이벤트를 발생시킨다.
     *
     * @param {(string | Event)} eventOrName
     * @param {*} [extendedValues]
     * @memberof Component
     */
    dispatchEvent(eventOrName: string | Event, extendedValues?: any): void;

}
