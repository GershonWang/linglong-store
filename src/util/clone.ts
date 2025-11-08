/**
 * 深拷贝工具函数
 * 替代 JSON.parse(JSON.stringify())，提供更好的性能和类型安全
 */

/**
 * 深拷贝函数
 * @param obj 要拷贝的对象
 * @returns 拷贝后的新对象
 */
export function deepClone<T>(obj: T): T {
    // 处理 null 和 undefined
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    // 处理基本类型
    if (typeof obj !== 'object') {
        return obj;
    }
    
    // 处理 Date
    if (obj instanceof Date) {
        return new Date(obj.getTime()) as unknown as T;
    }
    
    // 处理 Array
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item)) as unknown as T;
    }
    
    // 处理普通对象
    if (typeof obj === 'object') {
        const clonedObj = {} as T;
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
    
    return obj;
}

/**
 * 浅拷贝函数（性能更好，适用于简单对象）
 * @param obj 要拷贝的对象
 * @returns 拷贝后的新对象
 */
export function shallowClone<T>(obj: T): T {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return [...obj] as unknown as T;
    }
    
    if (typeof obj === 'object') {
        return { ...obj };
    }
    
    return obj;
}

