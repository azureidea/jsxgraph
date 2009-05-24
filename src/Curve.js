/*
    Copyright 2008,2009
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
 * @fileoverview In this file the geometry element Curve is defined.
 * @author graphjs
 * @version 0.1
 */

/**
 * Construct and handle graphs of functions and parameter curves.
 * @class Curve: On creation the GEONExT syntax
 * of the function term 
 * is converted into JavaScript syntax.
 * It inherits from @see GeometryElement.
 * The defining array "parents" consists of
 * the variable name (usuallay 'x' or 't'), it is only needed for reading of GEONExT constructions,
 * the term for the first coordinate, 
 * the term for the second coordinate, 
 * the lower and upper bounds
 * for the variable. The latter two can be null. In this case the default 
 * bounds are the left and right border of the canvas.
 * @constructor
 * @return A new geometry element Curve
 */
JXG.Curve = function (board, parents, id, name) {
    this.constructor();
 
    this.points = [];
    this.numberPoints = 0;

    this.type = JXG.OBJECT_TYPE_CURVE;
    this.elementClass = JXG.OBJECT_CLASS_CURVE;                
    
    this.init(board, id, name);
    this.init(board, id, name);

    this.visProp['strokeWidth'] = this.board.options.curve.strokeWidth;

    this.visProp['visible'] = true;
    this.dataX = null;
    this.dataY = null;
    
    /**
     * The curveType is set in @see generateTerm and used in 
     * @see updateCurve
     * Possible values are:
     * 'none'
     * 'plot': Data plot
     * 'parameter': we can not distinguish function graphs and parameter curves
     * 'functiongraph': function graph
     * 'polar'
     * 'implicit' (not yet)
     *
     * Only parameter and plot are set directly.
     * polar is set with setProperties only.
     **/
    // this.curveType = 'none';
    this.curveType = null;

    if (parents[0]!=null) {
        this.varname = parents[0];
    } else {
        this.varname = 'x';
    }
    this.xterm = parents[1];  // function graphs: "x"
    this.yterm = parents[2];  // function graphs: e.g. "x^2"
    this.generateTerm(this.varname,this.xterm,this.yterm,parents[3],parents[4]);  // Converts GEONExT syntax into JavaScript syntax
    this.updateCurve();                        // First evaluation of the curve
    this.id = this.board.addCurve(this);
    
    if (typeof this.xterm=='string') {
        this.notifyParents(this.xterm);
    }
    if (typeof this.yterm=='string') {
        this.notifyParents(this.yterm);
    }
};
JXG.Curve.prototype = new JXG.GeometryElement;

/**
 * Gives the default value of the left bound for the curve.
 * May be overwritten in @see generateTerm.
 */
JXG.Curve.prototype.minX = function () {
    if (this.curveType=='polar') {
        return 0.0;
    } else {
        var leftCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0, 0], this.board);
        return leftCoords.usrCoords[1];
    }
};

/**
 * Gives the default value of the right bound for the curve.
 * May be overwritten in @see generateTerm.
 */
JXG.Curve.prototype.maxX = function () {
    if (this.curveType=='polar') {
        return 2.0*Math.PI;
    } else {
        var rightCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [this.board.canvasWidth, 0], this.board);
        return rightCoords.usrCoords[1];
    }
};

/**
 * Checks whether (x,y) is near the curve.
 * @param {int} x Coordinate in x direction, screen coordinates.
 * @param {int} y Coordinate in y direction, screen coordinates.
 * @param {y} Find closest point on the curve to (x,y)
 * @return {bool} True if (x,y) is near the curve, False otherwise.
 */
JXG.Curve.prototype.hasPoint = function (x,y) {
    var t, dist, c, trans, i, j, tX, tY;
    var lbda, x0, y0, x1, y1, den;
    var prec = 5/(this.board.unitX*this.board.zoomX); // uebergangsweise = 5px
    var checkPoint = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x,y], this.board);
    x = checkPoint.usrCoords[1];
    y = checkPoint.usrCoords[2];
    if (this.curveType=='parameter' || this.curveType=='polar') { 
        // Brute fore search for a point on the curve close to the mouse pointer
        var steps = 300;
        var d = (this.maxX()-this.minX())/steps;
        for (i=0,t=this.minX(); i<steps; i++) {
            tX = this.X(t);
            tY = this.Y(t);
            for (j=0; j<this.transformations.length; j++) {
                trans = this.transformations[j];
                trans.update();
                c = trans.matVecMult(trans.matrix,[1,tX,tY]);
                tX = c[1];
                tY = c[2];
            }
            dist = Math.sqrt((x-tX)*(x-tX)+(y-tY)*(y-tY));
            if (dist<prec) { return true; }
            t+=d;
        }  
    } else if (this.curveType == 'plot') {
        for (i=0;i<this.numberPoints-1;i++) {
            x1 = this.X(i+1)-this.X(i);
            y1 = this.Y(i+1)-this.Y(i);
            x0 = x-this.X(i);
            y0 = y-this.Y(i);
            den = x1*x1+y1*y1;
            
            if (den>=JXG.Math.eps) {
                lbda = (x0*x1+y0*y1)/den;
                dist = Math.sqrt( x0*x0+y0*y0 - lbda*(x0*x1+y0*y1) );
            } else {
                lbda = 0.0;
                dist = Math.sqrt(x0*x0+y0*y0);
            }
            if (lbda>=0.0 && lbda<=1.0 && dist<prec) { 
                return true; 
            } 
        }
        return false;
    } else { // functiongraph
        // Brute force search for a point on the curve close to the mouse pointer
        var steps = 300;
        var d = (this.maxX()-this.minX())/steps;
        for (i=0,t=this.minX(); i<steps; i++) {
            tX = this.X(t);
            tY = this.Y(t);
            for (j=0; j<this.transformations.length; j++) {
                trans = this.transformations[j];
                trans.update();
                c = trans.matVecMult(trans.matrix,[1,tX,tY]);
                tX = c[1];
                tY = c[2];
            }
            dist = Math.sqrt((x-tX)*(x-tX)+(y-tY)*(y-tY));
            if (dist<prec) { return true; }
            t+=d;
        }
        //dist = Math.abs(this.Y(x)-y);
    }
    return (dist<prec);

};

/**
  * Allocate points in the Coords array this.points
  */
JXG.Curve.prototype.allocatePoints = function () {
    // At this point this.numberPoints has been set in this.generateTerm
    if (this.points.length<this.numberPoints) {
        for (var i=this.points.length;i<this.numberPoints;i++) {
            this.points[i] = new JXG.Coords(JXG.COORDS_BY_USER, [0,0], this.board);
        }
    }
};

/**
 * Computes for equidistant points on the x-axis the values
 * of the function. @see #updateCurve
 * Then, the update function of the renderer
 * is called. 
 */
JXG.Curve.prototype.update = function () {
    if (this.needsUpdate) {
        this.updateCurve();
    }
};

/**
 * Then, the update function of the renderer
 * is called. 
 */
JXG.Curve.prototype.updateRenderer = function () {
    if (this.needsUpdate) {
        this.board.renderer.updateCurve(this);
        this.needsUpdate = false;
    }
};

/**
  * For dynamic dataplots updateCurve
  * can be used to compute new entries
  * for the arrays this.dataX and
  * this.dataY. It is used in @see updateCurve.
  * Default is an empty method, can be overwritten
  * by the user.
  */
JXG.Curve.prototype.updateDataArray = function () {};

/**
 * Computes for equidistant points on the x-axis the values
 * of the function. @see #update
 * If the mousemove event triggers this update, we use only few
 * points. Otherwise, e.g. on mouseup, many points are used.
 */
JXG.Curve.prototype.updateCurve = function () {
    this.updateDataArray();
    if (this.curveType=='plot' && this.dataX!=null) {
        this.numberPoints = this.dataX.length;
    } else {
        if (this.board.updateQuality==this.board.BOARD_QUALITY_HIGH) {
            this.numberPoints = this.board.canvasWidth*1.3;
        } else {
            this.numberPoints = this.board.canvasWidth*0.25;
        }
    }
    this.allocatePoints();  // It is possible, that the array length has increased.
    var len = this.numberPoints;

    var mi = this.minX();
    var ma = this.maxX();
    var x, y;
    var stepSize = (ma-mi)/len;

    for(var i=0;i<len;i++) {
        if (this.dataX!=null) { // x-coordinates are in an array
            x = i;
            if (this.dataY!=null) { // y-coordinates are in an array
                y = i;
            } else {
                y = this.X(x);
            }
        } else {     // continuous data
            x = mi+i*stepSize;
            y = x;
        }
        this.points[i].setCoordinates(JXG.COORDS_BY_USER, [this.X(x),this.Y(y)]);
        this.updateTransform(this.points[i]);
    }
};

JXG.Curve.prototype.updateTransform = function (p) {
    if (this.transformations.length==0) {
        return p;
    }
    for (var i=0;i<this.transformations.length;i++) {
        var t = this.transformations[i];
        t.update();
        var c = t.matVecMult(t.matrix,p.usrCoords);
        p.setCoordinates(JXG.COORDS_BY_USER,[c[1],c[2]]);
    }
    return p;
};

JXG.Curve.prototype.addTransform = function (transform) {
    var list;
    if (JXG.IsArray(transform)) {
        list = transform;
    } else {
        list = [transform];
    }
    for (var i=0;i<list.length;i++) {
        this.transformations.push(list[i]);
    }
};

JXG.Curve.prototype.setPosition = function (method, x, y) {
    //if(this.group.length != 0) {
    // AW: Do we need this for lines?
    //} else {
    var t = this.board.createElement('transform',[x,y],{type:'translate'});
    if (this.transformations.length>0 && this.transformations[this.transformations.length-1].isNumericMatrix) {
        this.transformations[this.transformations.length-1].melt(t);
    } else {
        this.addTransform(t);
    }
    //this.update();
    //}
};

/**
 * Converts the GEONExT syntax of the defining function term into JavaScript.
 * New methods X() and Y() for the Curve object are generated, further
 * new methods for minX() and maxX().
 *
 * Also, all objects whose name appears in the term are searched and
 * the curve is added as child to these objects. (Commented out!!!!)
 * @see Algebra
 * @see #geonext2JS.
 */
JXG.Curve.prototype.generateTerm = function (varname, xterm, yterm, mi, ma) {
    // Generate the methods X() and Y()
    this.numberPoints = this.board.canvasWidth*1.0;
    if (typeof xterm=='string') {
        // Convert GEONExT syntax into  JavaScript syntax
        var newxterm = this.board.algebra.geonext2JS(xterm);
        this.X = new Function(varname,'return ' + newxterm + ';');
        this.curveType = 'functiongraph';
    } else if (typeof xterm=='function') {
        this.X = xterm;
        this.curveType = 'parameter';
    } else if (typeof xterm=='number') {
        this.X = function() { return xterm; };
        this.curveType = 'parameter';
    } else if (typeof xterm=='object') {  // array of values
        this.curveType = 'plot';
        this.dataX = xterm;
        this.X = function(i) { return this.dataX[i]; };
        this.numberPoints = this.dataX.length;
    }
    
    if (typeof yterm=='string') {
        // Convert GEONExT syntax into  JavaScript syntax
        var newyterm = this.board.algebra.geonext2JS(yterm);
        this.Y = new Function(varname,'return ' + newyterm + ';');
    } else if (typeof yterm=='function') {
        this.Y = yterm;
    } else if (typeof yterm=='number') {
        this.Y = function() { return yterm; };
    } else if (typeof yterm=='object') {  // array of values
        this.dataY = yterm;
        this.Y = function(i) { return this.dataY[i]; };
    }
    
    // polar form
    if (typeof xterm=='function' && typeof yterm=='object') {
        this.X = function(phi){return (xterm)(phi)*Math.cos(phi)+yterm[0];};
        this.Y = function(phi){return (xterm)(phi)*Math.sin(phi)+yterm[1];};
        this.curveType = 'parameter';
    }

    // Set the bounds
    // lower bound
    if (mi!=null) {
        if (typeof mi == 'string') {
            var newMin = this.board.algebra.geonext2JS(mi);
            this.minX = new Function('','return ' +  newMin + ';');
        } else if (typeof mi=='function') {
            this.minX = mi;
        } else if (typeof mi=='number') {
            this.minX = function() { return mi; };
        }
    }
    // upper bound
    if (ma!=null) {
        if (typeof ma == 'string') {
            var newMax = this.board.algebra.geonext2JS(ma);
            this.maxX = new Function('','return ' +  newMax + ';');
        } else if (typeof ma=='function') {
            this.maxX = ma;
        } else if (typeof ma=='number') {
            this.maxX = function() { return ma; };
        }
    }
    
/*    
    // Find dependencies
    var elements = this.board.elementsByName;
    for (el in elements) {
        if (el != this.name) {
            var s1 = "X(" + el + ")";
            var s2 = "Y(" + el + ")";
            if (xterm.indexOf(s1)>=0 || xterm.indexOf(s2)>=0 ||
                yterm.indexOf(s1)>=0 || yterm.indexOf(s2)>=0) {
                elements[el].addChild(this);
            }
        }
    }
*/    
};

/**
 * Finds dependencies in a given term and notifies the parents by adding the
 * dependent object to the found objects child elements.
 * @param {String} term String containing dependencies for the given object.
 */
JXG.Curve.prototype.notifyParents = function (contentStr) {
    var res = null;
    var elements = this.board.elementsByName;

    this.board.algebra.findDependencies(this,contentStr);
};

JXG.createCurve = function(board, parents, attributes) {
    return new JXG.Curve(board, ['x'].concat(parents), attributes['id'], attributes['name']);
};

JXG.JSXGraph.registerElement('curve', JXG.createCurve);

/**
* Curve type "functiongraph"
* parents: [f, start, end] or [f]
**/
JXG.createFunctiongraph = function(board, parents, attributes) {
    var par = ["x","x"].concat(parents);
    if(attributes == null) 
        attributes = {};
    attributes.curveType = 'functiongraph';
    return new JXG.Curve(board, par, attributes['id'], attributes['name']);
};

JXG.JSXGraph.registerElement('functiongraph', JXG.createFunctiongraph);


/**
 * Create a dynamic spline interpolated curve given by sample points p_1 to p_n.
 * @param {JXG.Board} board Reference to the board the spline is drawn on.
 * @param {Array} parents Array of points the spline interpolates
 * @param {Object} attributes Define color, width, ... of the spline
 * @type JXG.Curve
 * @return Returns reference to an object of type JXG.Curve.
 */
JXG.createSpline = function(board, parents, attributes) {
    // This is far away from being effective
    var F = function (t) {
        var x = new Array();
        var y = new Array();
        
        for(var i=0; i<parents.length; i++) {
            if(!JXG.IsPoint(parents[i]))
                throw "JXG.createSpline: Parents has to be an array of JXG.Point."
            
            x.push(parents[i].X());
            y.push(parents[i].Y());
        }
        
        // The array D has only to be calculated when the position of one or more sample point
        // changes. otherwise D is always the same for all points on the spline.
        var D = JXG.Math.Numerics.splineDef(x, y);
        return JXG.Math.Numerics.splineEval(t, x, y, D);
    }
    
    return new JXG.Curve(board, ["x","x", F], attributes);
}

/**
 * Register the element type spline at JSXGraph
 * @private
 */
JXG.JSXGraph.registerElement('spline', JXG.createSpline);

/**
 * Create Riemann sum for a given function.
 * @param {JXG.Board} board Reference to the board the spline is drawn on.
 * @param {f} function defining the Riemann sum
 * @param {n} partition number: number or function
 * @param {type} 'left', 'right' or 'middle'. 'left' is the default: string or function
 * @param {from} optional left interval border: number or function
 * @param {to} optional right interval border: number or function
 * @type JXG.Curve
 * @return Returns reference to an object of type JXG.Curve.
 */
JXG.createRiemannsum = function(board, parents, attributes) {
    var i,n,type,f;
    f = parents[0];
    if (typeof parents[1] == 'number') {
        n = function() {return parents[1];}
    } else if (typeof parents[1] == 'function') {
        n = parents[1];
    } else {
        throw "JXG.createRiemannsum: n has to be number or function."
    }
    if (typeof parents[2] == 'string') {
        type= function() {return parents[2];}
    } else if (typeof parents[2] == 'function') {
        type = parents[2];
    } else {
        throw "JXG.createRiemannsum: type has to be string or function."
    }

    var par = ['x', [0], [0]].concat(parents.slice(3));
    
    if(attributes == null) 
        attributes = {};
    attributes.opacity   = attributes.opacity || 0.3;
    attributes.fillColor = attributes.fillColor || '#ffff00';
    attributes.curveType = 'plot';
    var c = new JXG.Curve(board, par, attributes['id'], attributes['name']);
    c.updateDataArray = function() {
            var u = JXG.Math.Numerics.riemann(f,n(),type(),this.minX(),this.maxX());
            this.dataX = u[0];
            this.dataY = u[1];
        }
    return c;
};

JXG.JSXGraph.registerElement('riemannsum', JXG.createRiemannsum);
