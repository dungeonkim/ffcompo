import { Event } from 'ffevent';
import { EventDispatcher } from 'ffevent';

// type → Set of WeakRefs to its live components (getAllComponents). A Set, not an array: adding and
// removing stay O(1) however many components exist (an array scan per add was O(n²) overall).
const componentSearchMap = new WeakMap();
const refOf = new WeakMap();        // component → its one WeakRef

function typesOf( com ) {

    const types = [];
    for ( let proto = Object.getPrototypeOf( com ); proto != null && proto != Component.prototype; proto = Object.getPrototypeOf( proto ) ) types.push( proto.constructor );
    return types;

}

// collected components leave dead refs behind: sweep them once the set has doubled since the last sweep
function register( type, com ) {

    let set = componentSearchMap.get( type );
    if ( !set ) { set = new Set(); set.swept = 0; componentSearchMap.set( type, set ); }
    let ref = refOf.get( com );
    if ( !ref ) { ref = new WeakRef( com ); refOf.set( com, ref ); }
    set.add( ref );
    if ( set.size > 2 * set.swept + 64 ) sweep( set );

}

function sweep( set ) {

    for ( const ref of set ) if ( ref.deref() === undefined ) set.delete( ref );
    set.swept = set.size;

}

export class Component extends EventDispatcher {

    _parent;
    _components;
    _name;

    static {
        //@ts-ignore
        Event.COMPONENT_ADDED = Event.PREFIX + "componentAdded";
        //@ts-ignore
        Event.COMPONENT_REMOVED = Event.PREFIX + "componentRemoved";
    }

    constructor( extendedValues ) {

        super();
        Object.defineProperty( this,"_parent",{ value: undefined, enumerable: false } );
        Object.defineProperty( this,"_components",{ value: {}, enumerable: false } );
        Object.defineProperty( this,"_name",{ value: undefined, enumerable: false } );
        Object.defineProperty( this,"_parent",{ enumerable: false } );
        
        if ( extendedValues ) Object.assign( this,extendedValues );
    
    }

    get parent() {
    
        return this._parent?.deref();
    
    }

    addComponent( com, newComName ) {

        if ( com != null && com instanceof Component == false && typeof com == 'object' ) {

            // object를 바로 넣어서 약식으로 컴포넌트를 만들 수 있게 한다.
            com = new Component( com );
        
        }

        const comName = newComName ?? com._name;

        // 붙이려는 컴포넌트가 다른데 붙어있었던 경우 제거
        if ( com._parent != null ) {

            com.removeComponentFromParent();
        
        }

        if ( comName ) {

            // 같은 이름의 컴포넌트가 붙어있던 경우 이전 컴포넌트를 제거
            if ( this._components[comName] != null ) {

                this._components[comName].removeComponentFromParent();
            
            }
            com._name = comName;
        
        } else {

            com._name = '$$' + Object.values( this._components ).length;

        }
        this._components[com._name] = com;

        // 자신과 부모 클래스의 모든 타입에 등록한다.
        for ( const type of typesOf( com ) ) register( type, com );
        com._parent = new WeakRef( this );
        //@ts-ignore
        const event = new Event( Event.COMPONENT_ADDED, { parent: this, component: com } );
        
        this.dispatchEvent( event, null, true );
        com.dispatchEvent( event, null, true );

        return com;
    
    }

    removeComponentFromParent() {

        const parent = this._parent.deref();

        this._parent = null;

        if ( parent == undefined ) {

            return;
        
        }
        delete parent._components[this._name];

        // 등록했던 모든 타입에서 뺀다.
        const ref = refOf.get( this );
        for ( const type of typesOf( this ) ) {

            const set = componentSearchMap.get( type );
            if ( !set ) continue;
            set.delete( ref );
            if ( set.size === 0 ) componentSearchMap.delete( type );

        }
        
        //@ts-ignore
        const event = new Event( Event.COMPONENT_REMOVED, { parent, component: this } );

        parent.dispatchEvent( event,null, true );
        this.dispatchEvent( event,null, true );
    
    }
    
    removeComponent( com ) {

        let removed = 0;

        // ClassType으로 삭제를 시도하는 경우
        if ( typeof com == "function" ) {

            for ( const child of Object.values( this._components ) ) {

                if ( child instanceof com ) {

                    child.removeComponentFromParent();
                    removed++;
                
                }
            
            }

        } else {

            const targetCom = this.getComponent( com );

            if ( targetCom ) {

                targetCom.removeComponentFromParent();
                removed++;
            
            }
        
        }
        console.assert( removed > 0, "삭제할 컴포넌트를 찾을 수 없다" );
    
    }

    get components() {

        return this._components;
    
    }

    hasComponent( comType ) {

        if ( typeof comType == "function" ) {

            for ( const com of Object.values( this._components ) ) {
                    
                if ( com instanceof comType ) {

                    return true;
                
                }
            
            }

        } else if ( comType instanceof Component ) {

            return this._components[comType._name] != null;
            
        }
    
    }

    getComponent( com ) {

        if ( typeof com == "function" ) {

            for ( const child of Object.values( this._components ) ) {

                if ( child instanceof com ) {

                    // 가장 먼저 삽입한 컴포넌트를 반환한다.
                    return child;
                
                }
            
            }

        } else if ( typeof com == "string" ) {

            return this._components[com];
        
        } 
        return null;
    
    }

    getCompatibleComponents( comType ) {

        const r = [];

        for ( const child of Object.values( this._components ) ) {

            if ( child instanceof comType ) {

                r.push( child );
            
            }
        
        }

        return r;
    
    }

    static _getAllComponentsNativeArray( comType ) {

        const set = componentSearchMap.get( comType );

        if ( set == null ) return null;
        sweep( set );
        if ( set.size === 0 ) componentSearchMap.delete( comType );
        return [ ...set ];
    
    }

    static getAllComponents( comType ) {

        return this._getAllComponentsNativeArray( comType )?.map( item => item.deref() ) ?? [];
    
    }


    hasAllComponents( ...comTypes ) {

        for ( const comType of comTypes ) {

            if ( !this.hasComponent( comType ) ) return false;
        
        }

        return true;
    
    }

    dispatchEvent( eventOrName,extendedValues,withoutComponents ) {

        if ( !withoutComponents ) {

            for ( const child of Object.values( this._components ) ) {

                child.dispatchEvent( eventOrName, extendedValues );
        
            }

        }

        return super.dispatchEvent.call( this, eventOrName,extendedValues );
    
    }

}

