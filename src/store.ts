export type {StoreEntry, Entry, TaggedEntries, Store}
export {MemoryStore}

interface StoreEntry {
    tag: string,
    count: number,
    date: number
}

interface Entry {
    count: number,
    date: number
}

interface TaggedEntries {
    tag: string,
    entries: Entry[] 
}

interface Store {
    getData(): StoreEntry[]
    getTags(): string[]
    getTaggedData(tag: string): TaggedEntries
}

class MemoryStore implements Store {
    getData(): StoreEntry[] {
        const tag = "pushups";
        return Array.from(Array(100).keys()).map(key => {
            const count = Math.round(Math.random() * (80 - 10) + 10);
            return {tag, count, date: Date.now() - key * 3600000}
        })
    }

    getTags(): string[] {
        return Array.from(new Set(
            this.getData().map(({tag}) => tag)
        ));
    }

    getTaggedData(name: string): TaggedEntries {
        return ({
            tag: name,
            entries: this.getData()
                .filter(({tag}) => tag === name)
                .map(({tag, ...rest}) => rest)
        })
    }
}