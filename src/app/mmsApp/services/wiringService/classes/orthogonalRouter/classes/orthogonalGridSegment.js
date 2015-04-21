/**
 * Created by robertboyles on 4/14/15.
 */

'use strict';

var Point = require("./Point.js");

var OrthogonalGridSegment = function( x1, y1, x2, y2 ) {

    if ( x1 !== null ) {
        this.x1 = x1;
    }
    if ( y1 !== null ) {
        this.y1 = y1;
    }
    if ( x2 !== null ) {
        this.x2 = x2;
    }
    if ( y2 !== null ) {
        this.y2 = y2;
    }

};


/**
 * Compare a segment's X-endpoint values against those in an array.
 * Return the matching index if one, of -1 if none.
 * @param arr - segments to compare against.
 * @returns {number} - index of matching segment
 */
OrthogonalGridSegment.prototype.getIndexUsingX = function( arr ) {

    for ( var i = 0; i < arr.length; i++ ) {
        if (arr[i].x1 === this.x1 && arr[i].x2 === this.x2) {
            return i;
        }
    }
    return -1;

};


/**
 * Compare a segment's Y-endpoint values against those in an array.
 * Return the matching index if one, of -1 if none.
 * @param arr - segments to compare against.
 * @returns {number} - index of matching segment
 */
OrthogonalGridSegment.prototype.getIndexUsingY = function( arr ) {

    for (var i = 0; i < arr.length; i++) {
        if (arr[i].y1 === this.y1 && arr[i].y2 === this.y2) {
            return i;
        }
    }
    return -1;

};


/**
 * Check if segments with same starting point have same ending point.
 * If both segment's endpoints match one of the segments in the list, set equal to true.
 * If segment starting point does not match any in the list, return -1.
 *
 * Generalizing min/max removes the need for two similar functions, one for X, and one for Y.
 * @param arr - Array of segments to compare against.
 * @param min - x1/y1 of segments
 * @param max - x2/y2 of segments
 * @returns {*}
 */
OrthogonalGridSegment.prototype.inSetAndLessThanOrEqual = function ( arr, min, max ) {

    for (var i = 0; i < arr.length; i++) {

        if (this[max] < arr[i][max] && this[min] === arr[i][min]) {
            return {"idx": i, "equal": false, "end": 2};
        }

        if (this[max] === arr[i][max] && this[min] === arr[i][min]) {
            return {"idx": i, "equal": true};
        }
    }

    return -1;

};


/**
 * If a common endpoint exists, return this point. Otherwise, return null.
 * @param segment2
 * @returns {*}
 */
OrthogonalGridSegment.prototype.getSharedEndPoint = function ( segment2 ) {

    // If and endpoint is shared, return this point. Otherwise, return null.

    if ( this.isPointOnLine( {x: segment2.x1, y: segment2.y1} ) ) {
        return new Point( segment2.x1, segment2.y1 );
    }

    else if ( this.isPointOnLine( {x: segment2.x2, y: segment2.y2} ) ) {
        return new Point( segment2.x2, segment2.y2 );
    }

    else if ( segment2.isPointOnLine( {x: this.x1, y: this.y1} ) ) {
        return new Point( this.x1, this.y1 );
    }

    else if ( segment2.isPointOnLine( {x: this.x2, y: this.y2} ) ) {
        return new Point( this.x2, this.y2 );
    }

    else {
        return null;
    }

};


/**
 * Return true if a point lies on a grid segment, endpoints included.
 * @param point
 * @returns {boolean}
 */
OrthogonalGridSegment.prototype.isPointOnLine = function ( point ) {

    var slope = ( this.y2 - this.y1 ) / (this.x2 - this.x1 );

    if (slope === Number.POSITIVE_INFINITY) {

        if (point.y < this.y1 || point.y > this.y2) {
            // Out of range
            return false;
        }

        return (point.x === this.x1);
    }
    else if (slope === 0) {

        if (point.x < this.x1 || point.x > this.x2) {
            // Out of range
            return false;
        }

        return (point.y === this.y1);
    }

    return ((point.y - this.y1) === (point.x - this.x1));
};


module.exports = OrthogonalGridSegment;


