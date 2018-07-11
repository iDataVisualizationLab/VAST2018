let utils = {
    datediff: function (first, second) {
        return Math.round((second - first) / (1000 * 60 * 60 * 24));
    },
    monthdiff: function (d1, d2) {
        var months;
        months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth();
        months += d2.getMonth();
        return months;
    },
    monthFormat(date) {
        let formatter = d3.timeFormat('%Y-%m');
        return formatter(date);
    },

};

/*Inspired from http://bl.ocks.org/dahtah/4731053*/
function variance(u) {
    var n = u.length, alpha = (n / (n - 1));
    var r = (d3.mean(u.map(function (v) {
        return v * v;
    })) - Math.pow(d3.mean(u), 2));
    return alpha * r;
}

function standardise(u) {
    var m = d3.mean(u), s = Math.sqrt(variance(u));
    return u.map(function (v) {
        return (v - m) / s;
    });
}
//Compute Pearson's correlation between u and v
Array.prototype.mult = function (b) {
    var s = Array(this.length);
    for (var ind = 0; ind < this.length; ind++) {
        if (typeof(b) == "number") {
            s[ind] = this[ind] * b;
        }
        else {
            s[ind] = this[ind] * b[ind];
        }
    }
    return s;
};
let statistics = {
    normalBound: function (yValues) {
        // if (yValues.length < 4)
        //     return [d3.min(yValues), d3.max(yValues)];
        //
        // let values, q1, q3, iqr, maxValue, minValue;
        //
        // values = yValues.slice().sort((a, b) => a - b);
        //
        // if ((values.length / 4) % 1 === 0) {//find quartiles
        //     q1 = 1 / 2 * (values[(values.length / 4)] + values[(values.length / 4) + 1]);
        //     q3 = 1 / 2 * (values[(values.length * (3 / 4))] + values[(values.length * (3 / 4)) + 1]);
        // } else {
        //     q1 = values[Math.floor(values.length / 4 + 1)];
        //     q3 = values[Math.ceil(values.length * (3 / 4) + 1)];
        // }
        //
        // iqr = q3 - q1;
        // maxValue = q3 + iqr * 2.5;
        // minValue = q1 - iqr * 2.5;
        //
        // return [minValue, maxValue];
        return d3.extent(yValues);
    },
    pearsonCorcoef: function (u, v) {
        var us = standardise(u), vs = standardise(v), n = u.length;
        return (1 / (n - 1)) * d3.sum(us.mult(vs));
    }
}

class Node {
    constructor(value, next, prev) {
        this.value = value;
        this.next = next;
        this.prev = prev;
    }
}

//Remember to add the head/or tail to fixed list.
class LinkedList {
    constructor(node1, node2) {
        if (node1 && node2 && typeof node1 === "string" && typeof node2 === "string") {
            node1 = new Node(node1, null, null);
            node2 = new Node(node2, null, null);
        } else if (node1 && typeof node1 === "string") {
            node1 = new Node(node1, null, null);
        }
        if (node1 && node2) {
            node1.next = node2;
            node2.prev = node1;
            this.head = node1;
            this.tail = node2;
        } else if (node1) {
            this.head = node1;
            this.tail = node1;
        }
    }
    addToTail(node){
        if (typeof node === "string"){
            node = new Node(node, null, null);
        }
        if(this.isEmpty()){
            this.head = node;
            this.tail = node;
        }else{
            node.prev = this.tail;
            this.tail.next = node;
            this.tail = node;
        }
    }
    isEmpty() {
        return this.head == null;
    }

    removeHead() {
        this.head = this.head.next;
    }

    removeTail() {
        this.tail = this.tail.prev;
    }

    travel() {
        let result=[];
        let p = this.head;
        while (p != null) {
            result.push(p.value);
            p = p.next;
        }
        return result;
    }

    size() {
        let count = 0;
        let p = this.head;
        while (p != null) {
            count += 1;
            p = p.next;
        }
        return count;
    }

    swapHeadTail() {
        //Swap head and tail.
        let p = this.head;
        while (p) {
            let n = p.next;
            p.next = p.prev;
            p.prev = n;
            p = p.prev;//Prev, note next since we already swapped p
        }
        let n = this.head;
        this.head = this.tail;
        this.tail = n;
    }

    //Will join the link lists + remove the duplicated node (if connect and makes a circle) then will not join.
    join(linkedList) {
        if (linkedList.isEmpty()) {
            return null;
        }
        //Add tail to head
        if (this.tail.value === linkedList.head.value) {
            this.tail.next = linkedList.head.next;
            linkedList.head.next.prev = this.tail;
            this.tail = linkedList.tail;
            linkedList = null;
            return null;
        }
        //Add head to tail
        if (this.head.value === linkedList.tail.value) {
            this.head.prev = linkedList.tail.prev;
            linkedList.tail.prev.next = this.head;
            this.head = linkedList.head;
            linkedList = null;
            return null;
        }
        //Add head to head
        if (this.head.value === linkedList.head.value) {
            linkedList.swapHeadTail();
            //Add again.
            return this.join(linkedList);
        }
        //Add tail to tail
        if (this.tail.value === linkedList.tail.value) {
            linkedList.swapHeadTail();
            //Add again
            return this.join(linkedList);
        }
        //In case we cannot add at all, we return the linkedList
        return linkedList;
    }

    makesCircle(linkedList) {
        if (linkedList.isEmpty() || this.isEmpty()) {
            return false;
        }
        //head and tail circle
        if (this.contains(linkedList.head) && this.contains(linkedList.tail)) {
            return true;
        }

    }

    containsInTheBody(node) {
        let nodeValue = (typeof node !== "string") ? node.value : node;
        let p = this.head.next;
        while (p != null && p.value !== this.tail.value) {
            if (p.value === nodeValue) {
                return true;
            }
            p = p.next;
        }
        return false;
    }

    contains(node) {
        let nodeValue = (typeof node !== "string") ? node.value : node;
        let p = this.head;
        while (p != null) {
            if (p.value === nodeValue) {
                return true;
            }
            p = p.next;
        }
        return false;
    }

    isValidToJoin(pair) {
        //If it makes a circle, then it is not valid
        if (this.makesCircle(pair)) {
            return false;
        }
        //If either head or tail of this pair
        if (this.containsInTheBody(pair.head) || this.containsInTheBody(pair.tail)) {
            return false;
        }
        return true;
    }

    containsAll(allItems) {
        //Check when one of the list contains all the elemnets then we stop.
        for (let i = 0; i < allItems.length; i++) {
            if (!this.contains(allItems[i])) {
                return false;
            }
        }
        return true;
    }
}

class Similarity {
    constructor(item1, item2, value) {
        this.item1 = item1;
        this.item2 = item2;
        this.value = value;
    }
}

let matrix = [
    new Similarity("L1", "L2", 0.5),
    new Similarity("L1", "L3", 0.5),
    new Similarity("L1", "L4", 1.0),
    new Similarity("L1", "L5", 0.1),
    new Similarity("L1", "L6", 0.6),
    new Similarity("L2", "L3", 0.5),
    new Similarity("L2", "L4", 0.4),
    new Similarity("L2", "L5", 0.6),
    new Similarity("L2", "L6", 0.3),
    new Similarity("L3", "L4", 0.0),
    new Similarity("L3", "L5", 0.2),
    new Similarity("L3", "L6", 0.6),
    new Similarity("L4", "L5", 0.1),
    new Similarity("L4", "L6", 0),
    new Similarity("L5", "L6", 0.3)
];

function rankBySimilarity(matrix) {
    //First sort it descendingly.
    matrix.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    let allItems = d3.set(matrix.map(d => d['item1'])).values();
    allItems = allItems.concat(d3.set(matrix.map(d => d['item2'])).values());
    allItems = d3.set(allItems).values();
    //Start with the highest one first.
    let resultList = [];
    let finalList = null;
    for (let c = 0; c < matrix.length; c++) {
        let row = matrix[c];
        let list = new LinkedList(row.item1, row.item2);
        if (resultList.length == 0) {
            resultList.push(list);
        } else {
            for (let i = 0; i < resultList.length; i++) {
                let currentList = resultList[i];
                if (!isValidForAllCurrentLists(resultList, list)) {
                    list = null;//It's not valid => so remove it.
                    break;//Breake because this pair of item is invalid => we will check the next pair.
                }else{
                    //Valid and could add
                    list = currentList.join(list);
                    if (list == null) {
                        //Check if we could join all the elements inside the current list
                        for (let i = 0; i < resultList.length - 1; i++) {
                            for (let j = i + 1; j < resultList.length; j++) {
                                if (resultList[i].join(resultList[j]) == null) {
                                    //Remove the element j since already joined with element i
                                    resultList.splice(j, 1);
                                }
                            }
                        }
                        break;
                    }
                }
            }
            if (list != null) {
                resultList.push(list);
            }
        }
        //Check to see which list contains all elements, then return that list.
        for (let i = 0; i < resultList.length; i++) {
            if (resultList[i].containsAll(allItems)) {
                finalList = resultList[i];
                return finalList;
            }
        }
    }
    return finalList;
}
function isValidForAllCurrentLists(resultList, list){
    for (let i = 0; i < resultList.length; i++) {
        let currentList = resultList[i];
        if(!currentList.isValidToJoin(list)){
            return false;
        }
    }
    return true;
}
