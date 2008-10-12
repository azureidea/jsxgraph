/*
    Copyright 2008, 
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * @fileoverview This file contains code for transformations of geometrical objects. 
 * @author graphjs
 * @version 0.1
 *
 * Possible types:
 * - translate
 * - reflect
 * - rotate
 * - shear
 * - generic
 *
 * Rotation matrix:
 * ( 1    0           0   )
 * ( 0    cos(a)   -sin(a))
 * ( 0    sin(a)   cos(a) )
 *
 * Translation matrix:
 * ( 1  0  0)
 * ( a  1  0)
 * ( b  0  1)

 */
JXG.Transformation = function(board,type, params) { 
    this.elementClass = JXG.OBJECT_CLASS_OTHER;                
    this.matrix = [[1,0,0],[0,1,0],[0,0,1]];
    this.board = board;
    this.isNumericMatrix = false;
    this.setMatrix(board,type,params);
};
JXG.Transformation.prototype = {};

JXG.Transformation.prototype.update = function(){};

/**
 * Set the transformation matrix for different 
 * types of standard transforms
 */
JXG.Transformation.prototype.setMatrix = function(board,type,params) {
    var i;
    this.isNumericMatrix = true;
    for (i=0;i<params.length;i++) {
        if (typeof params[i]!='number') {
            this.isNumericMatrix = false;
            break;
        }
    }
    
    if (type=='translate') {
        this.evalParam = JXG.createEvalFunction(board,params,2);
        this.update = function() {
            this.matrix[1][0] = this.evalParam(0);
            this.matrix[2][0] = this.evalParam(1);
        };
    } else if (type=='scale') {
        this.evalParam = JXG.createEvalFunction(board,params,2);
        this.update = function() {
            this.matrix[1][1] = this.evalParam(0); // x
            this.matrix[2][2] = this.evalParam(1); // y
        };
    } else if (type=='reflect') {  // Input: line or two points
        if (params.length<4) { // line or two points
            params[0] = JXG.GetReferenceFromParameter(board,params[0]);
        }
        if (params.length==2) { // two points
            params[1] = JXG.GetReferenceFromParameter(board,params[1]);
        }
        if (params.length==4) { // 4 coordinates [px,py,qx,qy]
            this.evalParam = JXG.createEvalFunction(board,params,4);
        }
        this.update = function() {
            if (params.length==1) { // line
                var x = params[0].point2.X()-params[0].point1.X();
                var y = params[0].point2.Y()-params[0].point1.Y();
                var xoff = params[0].point1.X();
                var yoff = params[0].point1.Y();
            } else if (params.length==2){ // two points
                var x = params[1].X()-params[0].X();
                var y = params[1].Y()-params[0].Y();
                var xoff = params[0].X();
                var yoff = params[0].Y();
            } else if (params.length==4){ // two points coordinates [px,py,qx,qy]
                var x = this.evalParam(2)-this.evalParam(0);
                var y = this.evalParam(3)-this.evalParam(1);
                var xoff = this.evalParam(0);
                var yoff = this.evalParam(1);
            }
            var d = x*x+y*y;
            this.matrix[1][1] = (x*x-y*y)/d;
            this.matrix[1][2] = 2*x*y/d;
            this.matrix[2][1] = 2*x*y/d;
            this.matrix[2][2] = (-x*x+y*y)/d;
            this.matrix[1][0] = xoff*(1-this.matrix[1][1])-yoff*this.matrix[1][2];
            this.matrix[2][0] = yoff*(1-this.matrix[2][2])-xoff*this.matrix[2][1];
        };
    } else if (type=='rotate') {
        if (params.length==3) { // angle, x, y
            this.evalParam = JXG.createEvalFunction(board,params,3);
        } else if (params.length<=2) { // angle, p or angle
            this.evalParam = JXG.createEvalFunction(board,params,1);
            if (params.length==2) {
                params[1] = JXG.GetReferenceFromParameter(board,params[1]);
            } 
        }
        this.update = function() {
            var beta = this.evalParam(0);
            this.matrix[1][1] = Math.cos(beta); 
            this.matrix[1][2] = -Math.sin(beta);  
            this.matrix[2][1] = Math.sin(beta); 
            this.matrix[2][2] = Math.cos(beta); 
            if (params.length>1) {  // rotate around [x,y] otherwise rotate around [0,0]
                if (params.length==3) {
                    var x = this.evalParam(1);
                    var y = this.evalParam(2);
                } else {
                    var x = params[1].X();
                    var y = params[1].Y();
                }
                this.matrix[1][0] = x*(1-Math.cos(beta))+y*Math.sin(beta);
                this.matrix[2][0] = y*(1-Math.cos(beta))-x*Math.sin(beta);
            }
        };
    } else if (type=='shear') {
        this.evalParam = JXG.createEvalFunction(board,params,1);
        this.update = function() {
            var beta = this.evalParam(0);
            this.matrix[1][1] = Math.tan(beta); 
        };
    } else if (type=='generic') {
        this.evalParam = JXG.createEvalFunction(board,params,9);
        this.update = function() {
            this.matrix[0][0] = this.evalParam(0); 
            this.matrix[0][1] = this.evalParam(1); 
            this.matrix[0][2] = this.evalParam(2); 
            this.matrix[1][0] = this.evalParam(3); 
            this.matrix[1][1] = this.evalParam(4); 
            this.matrix[1][2] = this.evalParam(5); 
            this.matrix[2][0] = this.evalParam(6); 
            this.matrix[2][1] = this.evalParam(7); 
            this.matrix[2][2] = this.evalParam(8); 
        };
    }
};

/**
 * Transform a GeometryElement:
 * First, update the matrix
 * Second, do the matrix-vector-multiplication
 *
 * @param {GeometryElement} element, which is transformed
 */
JXG.Transformation.prototype.apply = function(p){
    this.update();
    if (arguments[1]!=null) {
        return this.matVecMult(this.matrix,p.initialCoords.usrCoords);
    } else {
        return this.matVecMult(this.matrix,p.coords.usrCoords);
    }
};

/**
 * Apply a transformation once to a GeometryElement.
 * If it is a free point, then it can be dragged around later
 * and will overwrite the trasnformed coordinates.
 */
JXG.Transformation.prototype.applyOnce = function(p){
    if (!JXG.IsArray(p)) {   
        this.update();
        var c = this.matVecMult(this.matrix,p.coords.usrCoords);
        p.coords.setCoordinates(JXG.COORDS_BY_USER,[c[1],c[2]]);
    } else {
        for (var i=0; i<p.length; i++) {
            this.update();
            var c = this.matVecMult(this.matrix,p[i].coords.usrCoords);
            p[i].coords.setCoordinates(JXG.COORDS_BY_USER,[c[1],c[2]]);
        }
    }
};

/**
 * Bind a transformation to a GeometryElement
 */
JXG.Transformation.prototype.bindTo = function(p){
    if (JXG.IsArray(p)) {   
        for (var i=0; i<p.length; i++) {
            p[i].transformations.push(this);
        }
    } else {
        p.transformations.push(this);
    }
};

/**
 * Matrix-vector-multiplication.
 * @param {Array} mat1 In - Two dimensional array of numbers
 * @param {Array} vec In - Array of numbers
 * res: Output - Array of numbers containing result
 */
JXG.Transformation.prototype.matVecMult = function(mat1,vec) {
    return this.board.algebra.matVecMult(mat1,vec);
};

JXG.Transformation.prototype.setProperty = function(term) {};

/**
 * Multiplication of a transformation t from the right.
 * this = t join this
 */
JXG.Transformation.prototype.melt = function(t){
    var res = [];
    for (var i=0;i<t.matrix.length;i++) {
        res[i] = [];
    }
    this.update();
    t.update();
    for (i=0;i<t.matrix.length;i++) {
        for (var j=0;j<this.matrix[0].length;j++) {
            var s = 0;
            for (var k=0;k<this.matrix.length;k++) {
                s += t.matrix[i][k]*this.matrix[k][j];
            }
            res[i][j] = s;
        }
    }
    this.update = function() {
        for (i=0;i<this.matrix.length;i++) {
            for (j=0;j<this.matrix[0].length;j++) {
                this.matrix[i][j] = res[i][j];
            }
        }
    };
    return true;
};

JXG.createTransform = function(board, parentArr, atts) {
    return new JXG.Transformation(board,atts['type'],parentArr);
};

JXG.JSXGraph.registerElement('transform', JXG.createTransform);