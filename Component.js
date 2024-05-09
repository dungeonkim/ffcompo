import { Event } from 'ffevent';
import { EventDispatcher } from 'ffevent';

const componentSearchMap = new WeakMap();

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
    
        return this._parent.deref();
    
    }

    addComponent( com, newComName ) {

        if ( com != null && com instanceof Component == false && typeof com == 'object' ) {

            // object를 바로 넣어서 약식으로 컴포넌트를 만들 수 있게 한다.
            com = new Component( com );
        
        }

        const comName = newComName ?? com._name;

        // 붙이려는 컴포넌트가 다른데 붙어있었던 경우 제거
        if ( com._parent != null ) {

            com.removeFromParent();
        
        }

        if ( comName ) {

            // 같은 이름의 컴포넌트가 붙어있던 경우 이전 컴포넌트를 제거
            if ( this._components[comName] != null ) {

                this._components[comName].removeFromParent();
            
            }
            com._name = comName;
        
        } else {

            com._name = '$$' + Object.values( this._components ).length;

        }
        this._components[com._name] = com;

        const prototypes = [];

        // 자신과 부모 클래스의 모든 프로토타입을 찾아서 등록한다.
        for ( let proto = Object.getPrototypeOf( com ); proto != null && proto != Component.prototype; proto = Object.getPrototypeOf( proto ) ) {

            prototypes.push( proto.constructor );
        
        }
        for ( const proto of prototypes ) {

            const arr = componentSearchMap.get( proto ) ?? [];

            let found = false;

            for ( const item of arr ) {

                if ( item.deref() === com ) {

                    found = true;
                    break;
                
                }
            
            }

            if ( !found ) {

                arr.push( new WeakRef( com ) );
                componentSearchMap.set( proto,arr.filter( item => item.deref() !== undefined ) );
            
            }
        
        }
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

        let arr = componentSearchMap.get( this.constructor );

        console.assert( Array.isArray( arr ) );

        arr = arr.filter( item => {

            let derefValue = item.deref();

            if ( derefValue === undefined ) {

                return false;
            
            }
            return derefValue !== this;

        } );


        if ( arr.length > 0 ) {

            componentSearchMap.set( this.constructor,arr );
        
        } else {

            componentSearchMap.delete( this.constructor );
        
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

                    child.removeFromParent();
                    removed++;
                
                }
            
            }

        } else {

            const targetCom = this.getComponent( com );

            if ( targetCom ) {

                targetCom.removeFromParent();
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

        let arr = componentSearchMap.get( comType );
        
        if ( arr == null ) return null;

        arr = arr.filter( item => item.deref() !== undefined );

        if ( arr.length > 0 ) {

            componentSearchMap.set( comType,arr );
        
        } else {

            componentSearchMap.delete( comType.constructor );
        
        }

        return arr;
    
    }

    static getAllComponents( comType ) {

        return this._getAllComponentsNativeArray( comType ).map( item => item.deref() );
    
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

