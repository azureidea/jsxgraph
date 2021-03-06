/*
    Copyright 2008-2010
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
 * @fileoverview The Board object is defined in this file. Board controls all properties and methods
 * used to manage a geonext board like adding geometric elements, removing them, managing
 * mouse over, drag & drop of geometric objects etc.
 * @author graphjs
 * @version 0.1
 */

/**
 * Constructs a new Board object.
 * @class The Board class stores all methods and properties required
 * to manage a JSXGraph board like adding geometric elements, removing them, managing
 * mouse over, drag & drop of geometric objects etc. You should never create a board using this constructor.
 * Please use {@link JXG.JSXGraph#initBoard} instead.
 * @constructor
 * @param {String,Object} container The id or reference of the html-element the board is drawn in. This is usually a HTML div.
 * @param {JXG.AbstractRenderer} renderer The reference of a renderer.
 * @param {String} id Unique identifier for the board, may be an empty string or null or even undefined.
 * @param {JXG.Coords} origin The coordinates where the origin is placed, in user coordinates.
 * @param {Number} zoomX Zoom factor in x-axis direction
 * @param {Number} zoomY Zoom factor in y-axis direction
 * @param {int} unitX Units in x-axis direction
 * @param {int} unitY Units in y-axis direction
 * @param {int} canvasWidth  The width of canvas
 * @param {int} canvasHeight The height of canvas
 * @param {Boolean} showCopyright Display the copyright text
 */
JXG.Board = function(container, renderer, id, origin, zoomX, zoomY, unitX, unitY, canvasWidth, canvasHeight, showCopyright) {
    /**
     * Board is in no special mode, objects are highlighted on mouse over and objects may be
     * clicked to start drag&drop.
     * @type int
     * @private
     * @final
     */
    this.BOARD_MODE_NONE = 0x0000;

    /**
     * Board is in drag mode, objects aren't highlighted on mouse over and the object referenced in
     * drag_obj is updated on mouse movement.
     * @type int
     * @see JXG.Board#drag_obj
     * @private
     * @final
     */
    this.BOARD_MODE_DRAG = 0x0001;

    /**
     * Board is in construction mode, objects are highlighted on mouse over and the behaviour of the board
     * is determined by the construction type stored in the field constructionType.
     * @type int
     * @see JXG.Board#constructionType
     * @private
     * @final
     */
    this.BOARD_MODE_CONSTRUCT = 0x0010;

    /**
     * Board is in move origin mode.
     * @type int
     * @private
     * @final
     */
    this.BOARD_MODE_MOVE_ORIGIN = 0x0002;

    /**
     /* Updating is made with low quality, e.g. graphs are evaluated at a lesser amount of points.
     * @type int
     * @see JXG.Board#updateQuality
     * @private
     * @final
     */
    this.BOARD_QUALITY_LOW = 0x1;

    /**
     * Updating is made with high quality, e.g. graphs are evaluated at much more points.
     * @type int
     * @see JXG.Board#updateQuality
     * @private
     * @final
     */
    this.BOARD_QUALITY_HIGH = 0x2;

    /**
     * When the board is in construction mode this construction type says we want to construct a point.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_POINT         = 0x43545054;       // CTPT
    /**
     * When the board is in construction mode this construction type says we want to construct a circle.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_CIRCLE        = 0x4354434C;       // CTCL
    /**
     * When the board is in construction mode this construction type says we want to construct a line.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_LINE          = 0x43544C4E;       // CTLN
    /**
     * When the board is in construction mode this construction type says we want to construct a glider.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_GLIDER        = 0x43544744;       // CTSD
    /**
     * When the board is in construction mode this construction type says we want to construct a midpoint.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_MIDPOINT      = 0x43544D50;       // CTMP
    /**
     * When the board is in construction mode this construction type says we want to construct a perpendicular.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_PERPENDICULAR = 0x43545044;       // CTPD
    /**
     * When the board is in construction mode this construction type says we want to construct a parallel.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_PARALLEL      = 0x4354504C;       // CTPL
    /**
     * When the board is in construction mode this construction type says we want to construct a intersection.
     * @type int
     * @private
     * @final
     */
    this.CONSTRUCTION_TYPE_INTERSECTION  = 0x43544953;       // CTIS

    /**
     * The html-id of the html element containing the board.
     * @type String
     */
    this.container = container;

    /**
     * Pointer to the html element containing the board.
     * @type Object
     */
    this.containerObj = document.getElementById(this.container);
    if (this.containerObj==null) {
        throw new Error("\nJSXGraph: HTML container element '" + (container) + "' not found.");
    }
    //this.containerObj.undoPositioned;  //???

    /**
     * A reference to this boards renderer.
     * @private
     * @type JXG.AbstractRenderer
     */
    this.renderer = renderer;

    /**
    * Some standard options
    * @type JXG.Options
    */
    this.options = JXG.deepCopy(JXG.Options);

    /**
     * Dimension of the board.
     * @private
     * @default 2
     * @type int
     */
    this.dimension = 2;

    /**
     * Coordinates of the boards origin.
     * @default [0, 0]
     * @type JXG.Coords
     */
    this.origin = {};
    this.origin.usrCoords = [1, 0, 0];
    this.origin.scrCoords = [1, origin[0], origin[1]];

    /**
     * Zoom factor in X direction
     * @type int
     */
    this.zoomX = zoomX;

    /**
     * Zoom factor in Y direction
     * @type int
     */
    this.zoomY = zoomY;

    /**
     * The number of pixels which represent
     * one unit in user-coordinates in x direction.
     * @type int
     */
    this.unitX = unitX;

    /**
     * The number of pixels which represent
     * one unit in user-coordinates in y direction.
     * @type int
     */
    this.unitY = unitY;

    /**
     * Saving some multiplications
     * @type int
     * @private
     */
    this.stretchX = this.zoomX*this.unitX;
    /**
     * Saving some multiplications
     * @type int
     * @private
     */
    this.stretchY = this.zoomY*this.unitY;

    /**
     * Canvas Width
     * @type int
     */
    this.canvasWidth = canvasWidth;

    /**
     * Canvas Height
     * @type int
     */
    this.canvasHeight = canvasHeight;

    /**
     * Default font size for labels and texts.
     * @type int
     */
    this.fontSize = this.options.text.fontSize;

    /* If the given id is not valid, generate an unique id */
    if((id != '') && (id != null) && (typeof document.getElementById(id) != 'undefined'))
        this.id = id;
    else
        this.id = this.generateId();

    /**
     * An array containing all hook-functions.
     * @type Array
     */
    this.hooks = [];

    /**
     * An array containing all other boards that are updated after this board has been updated.
     * @private
     * @type Array
     */
    this.dependentBoards = [];

    /**
     * An associative array containing all geometric objects belonging to the board. Key is the id of the object and value is a reference to the object.
     * @private
     * @type Object
     */
    this.objects = {};

    /**
     * This is used for general purpose animations. Stores all the objects that are currently running an animation.
     * @private
     * @type Object
     */
    this.animationObjects = {};

    /**
     * An associative array containing all highlighted geometric objects belonging to the board.
     * @private
     * @type Object
     */
    this.highlightedObjects = {};

    /**
     * Number of objects ever created on this board. This includes every object, even invisible and deleted ones.
     * @private
     * @type int
     */
    this.numObjects = 0;

    /**
     * An associative array to store the objects of the board by name. the name of the object is the key and value is a reference to the object.
     * @type Object
     */
    this.elementsByName = {};

    /**
     * The board mode the board is currently in. Possible values are
     * <ul>
     * <li>JXG.Board.BOARD_MODE_NONE</li>
     * <li>JXG.Board.BOARD_MODE_DRAG</li>
     * <li>JXG.Board.BOARD_MODE_CONSTRUCT</li>
     * <li>JXG.Board.BOARD_MODE_MOVE_ORIGIN</li>
     * </ul>
     * @private
     * @type int
     */
    this.mode = this.BOARD_MODE_NONE;

    /**
     * The update quality of the board. In most cases this is set to {@link JXG.Board#BOARD_QUALITY_HIGH}. If {@link JXG.Board#mode} equals {@link JXG.Board#BOARD_MODE_DRAG}
     * this is set to {@link JXG.Board#BOARD_QUALITY_LOW} to speed up the update process by e.g. reducing the number of evaluation points when plotting functions. Possible values are
     * <ul>
     * <li>BOARD_QUALITY_LOW</li>
     * <li>BOARD_QUALITY_HIGH</li>
     * </ul>
     * @see JXG.Board#mode
     * @private
     * @type int
     */
    this.updateQuality = this.BOARD_QUALITY_HIGH;

   /**
    * If true updates are skipped
     * @private
    * @type Boolean
    */
   this.isSuspendedRedraw = false;

   /**
    * The way objects can be dragged. If true, objects can only moved on a predefined grid, if false objects can be moved smoothly almost everywhere.
    * @type Boolean
    * @default JXG.Options.grid#snapToGrid
    */
   this.snapToGrid = this.options.grid.snapToGrid;

   /**
    * The amount of grid points plus one that fit in one unit of user coordinates in x direction.
    * @type int
    * @default JXG.Options.grid#gridX
    */
   this.gridX = this.options.grid.gridX;

   /**
    * The amount of grid points plus one that fit in one unit of user coordinates in y direction.
    * @type int
    * @default JXG.Options.grid#gridY
    */
   this.gridY = this.options.grid.gridY;

   /**
    * Color of the grid.
    * @type String
    * @default JXG.Options.grid#gridColor
    */
   this.gridColor = this.options.grid.gridColor;

   /**
    * Opacity of the grid color, between 0 and 1.
    * @type Number
    * @default JXG.Options.grid#gridOpacity
    */
   this.gridOpacity = this.options.grid.gridOpacity;

   /**
    * Determines whether the grid is dashed or not.
    * @type Number
    * @default JXG.Options.grid#gridDash
    */
   this.gridDash = this.options.grid.gridDash;

   /**
    * The amount of grid points plus one for snapToGrid that fit in one unit of user coordinates in x direction.
    * @type int
    * @default JXG.Options.grid#snapSizeX
    */
   this.snapSizeX = this.options.grid.snapSizeX;

   /**
    * The amount of grid points plus one for snapToGrid that fit in one unit of user coordinates in y direction.
    * @type int
    * @default JXG.Options.grid#snapSizeY
    */
   this.snapSizeY = this.options.grid.snapSizeY;

   this.calculateSnapSizes();
    
   /**
    * Visibility of the boards grid. If hasGrid is true, a grid will be shown.
    * @private
    * @type Boolean
    * @default JXG.Options.grid#hasGrid
    */
   this.hasGrid = this.options.grid.hasGrid;

   /**
    * The distance from the mouse to the dragged object in x direction when the user clicked the mouse button.
    * @type int
    * @see JXG.Board#drag_dy
    * @see JXG.Board#drag_obj
    * @private
    */
   this.drag_dx = 0;

   /**
    * The distance from the mouse to the dragged object in y direction when the user clicked the mouse button.
    * @type int
    * @see JXG.Board#drag_dx
    * @see JXG.Board#drag_obj
    * @private
    */
   this.drag_dy = 0;

   /**
     * Absolute position of the mouse pointer in screen pixel from the top left corner
     * of the HTML window.
    * @type Array
     */
   this.mousePosAbs = [0,0];

    /**
     * Relative position of the mouse pointer in screen pixel from the top left corner
     * of the JSXGraph canvas (the div element contining the board).
     * @type Array
     */
   this.mousePosRel = [0,0];

   /**
    * A reference to the object that is dragged on the board. Usually this is an object of the class {@link JXG.Point}.
    * @private
    * @type Object
    */
   this.drag_obj = [];
   
   /**
    * This property is used to store the latest time the user clicked on the board and the position he clicked.
    * @type object
    */
    this.last_click = {
		time: 0,
		posX: 0,
		posY: 0
	};
    
   /**
    * A string containing the XML text of the construction.
    * This is set in {@link JXG.FileReader#parseString}.
    * Only useful if a construction is read from a GEONExT-, Intergeo-, Geogebra-, or Cinderella-File.
    * @type String
    * @private
    */
   this.xmlString = '';

    /**
    * Display the licence text.
    * @see JXG.JSXGraph#licenseText
    * @see JXG.JSXGraph#initBoard
    */
    this.showCopyright = false;
    if ( (showCopyright!=null && showCopyright) || (showCopyright==null && this.options.showCopyright) ) {
        this.renderer.displayCopyright(JXG.JSXGraph.licenseText,this.fontSize);
        this.showCopyright = true;
    }

   /**
    * Full updates are needed after zoom and axis translates.
    * This saves some time during update
    * @private
    * @default false
    * @type Boolean
    */
   this.needsFullUpdate = false;

   /**
    * if {reducedUpdate} is set to true, then only the dragged element and few (i.e. 2) following
    * elements are updated during mouse move. On mouse up the whole construction is
    * updated. This enables us to be fast even on very slow devices.
    * @private
    * @type Boolean
    * @default false
    */
    this.reducedUpdate = false;

    /**
     * The current color blindness deficiency is stored in this property. If color blindness is not emulated
     * at the moment, it's value is <tt>none</tt>.
     */
    this.currentCBDef = 'none';

   /**
    * If GEONExT constructions are displayed, then this property should be set to true.
    * Then no stdform updates and no dragging of lines, circles and curves is possible.
    * This is set in {@link JXG.GeonextReader#readGeonext}.
    * @private
    * @type Boolean
    * @default false
    * @see JXG.GeonextReader@readGeonext
    */
    this.geonextCompatibilityMode = false;

    if (this.options.text.useASCIIMathML) {
        if (typeof translateASCIIMath != 'undefined') {
            init();
        } else {
            this.options.text.useASCIIMathML = false;
        }
    }

    /**
     * Introduce our event handlers to the browser
     */
   JXG.addEvent(document, 'mousedown', this.mouseDownListener, this);
   JXG.addEvent(this.containerObj, 'mousemove', this.mouseMoveListener, this);


    /**
     * To run JSXGraph on an iPhone/iPod/iPad we need these event listeners.
     */
   JXG.addEvent(this.containerObj, 'touchstart', this.touchStartListener, this);
   JXG.addEvent(this.containerObj, 'touchmove', this.touchMoveListener, this);
   JXG.addEvent(this.containerObj, 'touchend', this.touchEndListener, this);

// This one produces errors on IE
//   JXG.addEvent(this.containerObj, 'contextmenu', function(e) { e.preventDefault(); return false;}, this);
// this one works on IE, Firefox and Chromium with default configurations
// It's possible this doesn't work on some Safari or Opera versions by default, the user then has to allow the deactivation of the context menu.
   this.containerObj.oncontextmenu = function(e) {if(e !== JXG.undefined) e.preventDefault(); return false; };
};

/**
 * Generates an unique name for the given object. The result depends on object.type, if the object is a {@link JXG.Point}, capital characters are used, if it is
 * of type {@link JXG.Line} only lower case characters are used. If object is of type {@link JXG.Polygon}, a bunch of lower case characters prefixed
 * with P_ are used. If object is of type {@link JXG.Circle} the name is generated using lower case characters. prefixed with k_ is used. In any
 * other case, lower case chars prefixed with s_ is used.
 * @param {String,Object} object Reference or id or name of an geometry object that is to be named.
 * @returns {String} Unique name for the object.
 * @private
 */
JXG.Board.prototype.generateName = function(object) {
    if(object.type == JXG.OBJECT_TYPE_TICKS) {
        return '';
    }

    var possibleNames;
    if(object.elementClass == JXG.OBJECT_CLASS_POINT) {
        // points have capital letters
        possibleNames = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
                                  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    }
    else {
        // all other elements get lowercase labels
        possibleNames = ['', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
                                  'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    }

    // maximum length of a name
    var maxNameLength = 3;
    var pre = '';
    var nameBase = '';
    var post = '';

    if(object.elementClass == JXG.OBJECT_CLASS_POINT || object.elementClass == JXG.OBJECT_CLASS_LINE) {
    }
    else {
        if(object.type == JXG.OBJECT_TYPE_POLYGON) {
            pre = 'P_{';
            post = '}';
        }
        else if(object.type == JXG.OBJECT_TYPE_CIRCLE) {
            pre = 'k_{';
            post = '}';
        }
        else if(object.type == JXG.OBJECT_TYPE_ANGLE) {
            pre = 'W_{';
            post = '}';
        }
        else {
            pre = 's_{';
            post = '}';
        }
    }
    var indices = [];
    var name = '';
    var tmp = '';

    var i = 0;
    var j = 0;

    for(i=0; i<maxNameLength; i++) {
        indices[i] = 0;
    }

    while (indices[maxNameLength-1] < possibleNames.length) {
        for(indices[0]=1; indices[0]<possibleNames.length; indices[0]++) {
            name = pre;

            for(i=maxNameLength; i>0; i--) {
                name += possibleNames[indices[i-1]];
            }

            if (this.elementsByName[name+post] == null) {
                return name+post;
            }

        }
        indices[0] = possibleNames.length;
        for(i=1; i<maxNameLength; i++) {
            if(indices[i-1] == possibleNames.length) {
                indices[i-1] = 1;
                indices[i]++;
            }
        }
    }

    return '';
};

/**
 * Generates unique id for a board. The result is randomly generated and prefixed with 'gxtBoard'.
 * @returns {String} Unique id for a board.
 * @private
 */
JXG.Board.prototype.generateId = function () {
    var r = 1;

    // as long as we don't have an unique id generate a new one
    while(JXG.JSXGraph.boards['gxtBoard' + r] != null) {
        r = Math.round(Math.random()*33);
    }

    return ('gxtBoard' + r);
};

/**
 * Composes the unique id for a board. If the ID is empty ('' or null) a new ID is generated, depending on the object type.
 * Additionally, the id of the label is set. As a side effect {@link JXG.Board#numObjects} is updated.
 * @param {Object} obj Reference of an geometry object that is to be named.
 * @param {int} type Type of the object.
 * @returns {String} Unique id for a board.
 * @private
 */
JXG.Board.prototype.setId = function (obj, type) {
    var num = this.numObjects,
        elId = obj.id;
    this.numObjects++;

    // Falls Id nicht vorgegeben, eine Neue generieren:
    if((elId == '') || (elId == null)) {
        elId = this.id + type + num;
    }
    // Objekt an den Renderer zum Zeichnen uebergeben
    obj.id = elId;
    // Objekt in das assoziative Array einfuegen
    this.objects[elId] = obj;

    if(obj.hasLabel) {
        obj.label.content.id = elId+"Label";
        this.addText(obj.label.content);
    }
    return elId;
};

/**
 * Calculates mouse coordinates relative to the boards container.
 * @param {Event} Event The browsers event object.
 * @return {Array} Array of coordinates relative the boards container top left corner.
 * @private
 */
JXG.Board.prototype.getRelativeMouseCoordinates = function (Event) {
    var pCont = this.containerObj,
        cPos = JXG.getOffset(pCont),
        n; //Element.cumulativeOffset(pCont);

    // add border width
    n = parseInt(JXG.getStyle(pCont,'borderLeftWidth'));
    if (isNaN(n)) n = 0; // IE problem if border-width not set explicitly
    cPos[0] += n;

    n = parseInt(JXG.getStyle(pCont,'borderTopWidth'));
    if (isNaN(n)) n = 0;
    cPos[1] += n;

    // add padding
    n = parseInt(JXG.getStyle(pCont,'paddingLeft'));
    if (isNaN(n)) n = 0;
    cPos[0] += n;

    n = parseInt(JXG.getStyle(pCont,'paddingTop'));
    if (isNaN(n)) n = 0;
    cPos[1] += n;

    return cPos;
};

/**
 * @private
 * Handler for click on left arrow in the navigation bar
 **/
JXG.Board.prototype.clickLeftArrow = function (Event) {
    this.origin.scrCoords[1] += this.canvasWidth*0.1;
    this.moveOrigin();
    return this;
};

/**
 * @private
 * Handler for click on right arrow in the navigation bar
 **/
JXG.Board.prototype.clickRightArrow = function (Event) {
    this.origin.scrCoords[1] -= this.canvasWidth*0.1;
    this.moveOrigin();
    return this;
};

/**
 * @private
 * Handler for click on up arrow in the navigation bar
 **/
JXG.Board.prototype.clickUpArrow = function (Event) {
    this.origin.scrCoords[2] += this.canvasHeight*0.1;
    this.moveOrigin();
    return this;
};

/**
 * @private
 * Handler for click on down arrow in the navigation bar
 **/
JXG.Board.prototype.clickDownArrow = function (Event) {
    this.origin.scrCoords[2] -= this.canvasHeight*0.1;
    this.moveOrigin();
    return this;
};

/**
 * iPhone-Events
 */

JXG.Board.prototype.touchStartListener = function (evt) {
	evt.preventDefault();

	// variable initialization
	var e = document.createEvent("MouseEvents"), i, shift = false;
	this.drag_obj = [];

	// special gestures
//	document.getElementById('debug').innerHTML = JXG.Math.Geometry.distance([evt.targetTouches[0].screenX, evt.targetTouches[0].screenY], [evt.targetTouches[1].screenX, evt.targetTouches[1].screenY]);
	if((evt.targetTouches.length==2) && (JXG.Math.Geometry.distance([evt.targetTouches[0].screenX, evt.targetTouches[0].screenY], [evt.targetTouches[1].screenX, evt.targetTouches[1].screenY])<80)) {
	    evt.targetTouches.length = 1;
	    shift = true;
	}

	// multitouch
	this.options.precision.hasPoint = this.options.precision.touch;
	for(i=0; i<evt.targetTouches.length; i++) {
		e.initMouseEvent('mousedown', true, false, this.containerObj, 0, evt.targetTouches[i].screenX, evt.targetTouches[i].screenY, evt.targetTouches[i].clientX, evt.targetTouches[i].clientY, false, false, shift, false, 0, null);
		this.mouseDownListener(e);
	}
};

JXG.Board.prototype.touchMoveListener = function (evt) {
	evt.preventDefault();
	var e = document.createEvent("MouseEvents"), i, myEvent;
	for(i=0; i<evt.targetTouches.length; i++) {
		myEvent = {pageX: evt.targetTouches[i].pageX, pageY: evt.targetTouches[i].pageY, clientX: evt.targetTouches[i].clientX, clientY: evt.targetTouches[i].clientY};
		this.mouseMoveListener(myEvent, i);
//		e.initMouseEvent('mousemove', true, false, this.containerObj, 0, evt.targetTouches[i].screenX, evt.targetTouches[i].screenY, evt.targetTouches[i].clientX, evt.targetTouches[i].clientY, false, false, false /*shift*/, false, 0, null);
	}
//	this.mouseMoveListener(e);
};

JXG.Board.prototype.touchEndListener = function (evt) {
	var e = document.createEvent("MouseEvents"), i;
//document.getElementById('debug').innerHTML += 'touch end<br />';
	for(i=0;i<evt.targetTouches.length;i++) {
		e.initMouseEvent('mouseup', true, false, this.containerObj, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		this.mouseUpListener(e);
	}
    this.options.precision.hasPoint = this.options.precision.mouse;
};

/**
 * This method is called by the browser when the left mouse button is released.
 * @param {Event}  evt The browsers event object.
 * @private
 */
JXG.Board.prototype.mouseUpListener = function (evt) {
    // redraw with high precision
    this.updateQuality = this.BOARD_QUALITY_HIGH;

    // release mouseup listener
    JXG.removeEvent(document, 'mouseup', this.mouseUpListener, this);

    this.mode = this.BOARD_MODE_NONE;

    // if origin was moved update everything
    if(this.mode == this.BOARD_MODE_MOVE_ORIGIN) {
        this.moveOrigin();
    } else {
        //this.fullUpdate(); // Full update only needed on moveOrigin? (AW)
        this.update();
    }

    // release dragged object
    this.drag_obj = [];

    this.updateHooks('mouseup');
};

/**
 * This method is called by the browser when the mouse is moved.
 * @param {Event} Evt The browsers event object.
 * @private
 */
JXG.Board.prototype.mouseDownListener = function (Evt) {
    var el, pEl, cPos, absPos, dx, dy;

    cPos = this.getRelativeMouseCoordinates(Evt);
    // position of mouse cursor relative to containers position of container
    absPos = JXG.getPosition(Evt);
    dx = absPos[0]-cPos[0]; //Event.pointerX(Evt) - cPos[0];
    dy = absPos[1]-cPos[1]; //Event.pointerY(Evt) - cPos[1];
    this.mousePosAbs = absPos; // Save the mouse position
    this.mousePosRel = [dx,dy];

    if(Evt.shiftKey) {
        this.drag_dx = dx - this.origin.scrCoords[1];
        this.drag_dy = dy - this.origin.scrCoords[2];
        this.mode = this.BOARD_MODE_MOVE_ORIGIN;
        //Event.observe(this.container, 'mouseup', this.mouseUpListener.bind(this));
        JXG.addEvent(document, 'mouseup', this.mouseUpListener, this);
        return;
    }
    if (this.mode==this.BOARD_MODE_CONSTRUCT) return;
    
    if(((new Date()).getTime() - this.last_click.time <500) && (JXG.Math.Geometry.distance(absPos, [this.last_click.posX, this.last_click.posY]) < 30)) {
		this.zoom100();
	}
	
	this.last_click.time = (new Date()).getTime();
	this.last_click.posX = absPos[0];
	this.last_click.posY = absPos[1];

    this.mode = this.BOARD_MODE_DRAG;
    if (this.mode==this.BOARD_MODE_DRAG) {
        for(el in this.objects) {
            pEl = this.objects[el];
            if( (pEl.hasPoint != undefined)
                    && ((pEl.type == JXG.OBJECT_TYPE_POINT) || (pEl.type == JXG.OBJECT_TYPE_GLIDER)
                        /*|| (!this.geonextCompatibilityMode && pEl.type == JXG.OBJECT_TYPE_LINE)  // not yet
                        || (!this.geonextCompatibilityMode && pEl.type == JXG.OBJECT_TYPE_CIRCLE)
                        || (!this.geonextCompatibilityMode && pEl.elementClass == JXG.OBJECT_CLASS_CURVE)*/ )
                    && (pEl.visProp['visible'])
                    && (!pEl.fixed) && (!pEl.frozen)
                    && (pEl.hasPoint(dx, dy))
                    ) {
                // Points are preferred:
                if ((pEl.type == JXG.OBJECT_TYPE_POINT) || (pEl.type == JXG.OBJECT_TYPE_GLIDER)) {
                    this.drag_obj.push(this.objects[el]);
                    if (this.options.takeFirst) break;
                }
            }
        }
    }

    // if no draggable object can be found, get outta here immediately
    if(this.drag_obj.length == 0) {
        this.mode = this.BOARD_MODE_NONE;
        return;
    }

    this.updateHooks('mousedown');

    /**
      * New mouse position in screen coordinates.
      */
    this.dragObjCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [dx,dy], this);
    JXG.addEvent(document, 'mouseup', this.mouseUpListener,this);
};

/**
 * This method is called by the browser when the left mouse button is clicked.
 * @param {Event} Event The browsers event object.
 * @private
 */
JXG.Board.prototype.mouseMoveListener = function (Event, i) {
    var el, pEl, cPos, absPos, newPos, dx, dy, fromTouch = false;

    if(typeof i == 'undefined') {
	i = 0;
	fromTouch = true;
    }

    cPos = this.getRelativeMouseCoordinates(Event);
    // position of mouse cursor relative to containers position of container
    absPos = JXG.getPosition(Event);
    dx = absPos[0]-cPos[0]; //Event.pointerX(Evt) - cPos[0];
    dy = absPos[1]-cPos[1]; //Event.pointerY(Evt) - cPos[1];

    this.mousePosAbs = absPos; // Save the mouse position
    this.mousePosRel = [dx,dy];

    this.updateQuality = this.BOARD_QUALITY_LOW;

    this.dehighlightAll(dx,dy);
    if(this.mode != this.BOARD_MODE_DRAG) {
        this.renderer.hide(this.infobox);
    }

    if(this.mode == this.BOARD_MODE_MOVE_ORIGIN) {
        this.origin.scrCoords[1] = dx - this.drag_dx;
        this.origin.scrCoords[2] = dy - this.drag_dy;
        this.moveOrigin();
    }
    else if(this.mode == this.BOARD_MODE_DRAG) {
        newPos = new JXG.Coords(JXG.COORDS_BY_SCREEN, this.getScrCoordsOfMouse(dx,dy), this);
//	for(i=0; i<this.drag_obj.length; i++) {

        if (this.drag_obj[i].type == JXG.OBJECT_TYPE_POINT
            || this.drag_obj[i].type == JXG.OBJECT_TYPE_LINE
            || this.drag_obj[i].type == JXG.OBJECT_TYPE_CIRCLE
            || this.drag_obj[i].elementClass == JXG.OBJECT_CLASS_CURVE) {

/*
            // Do not use setPositionByTransform at the moment!
            // This concept still has to be worked out.
	   // If you want to use the commented code you have to remember that this.drag_obj is an array now!

            if ((this.geonextCompatibilityMode && this.drag_obj.type==JXG.OBJECT_TYPE_POINT) || this.drag_obj.group.length != 0) {
                // This is for performance reasons with GEONExT files and for groups (transformations do not work yet with groups)
                this.drag_obj.setPositionDirectly(JXG.COORDS_BY_USER,newPos.usrCoords[1],newPos.usrCoords[2]);
            } else {
                this.drag_obj.setPositionByTransform(JXG.COORDS_BY_USER,
                    newPos.usrCoords[1]-this.dragObjCoords.usrCoords[1],
                    newPos.usrCoords[2]-this.dragObjCoords.usrCoords[2]);
                // Save new mouse position in screen coordinates.
                this.dragObjCoords = newPos;
            }
*/
            this.drag_obj[i].setPositionDirectly(JXG.COORDS_BY_USER,newPos.usrCoords[1],newPos.usrCoords[2]);
            this.update(this.drag_obj[i]);
        } else if(this.drag_obj[i].type == JXG.OBJECT_TYPE_GLIDER) {
            var oldCoords = this.drag_obj[i].coords;
            // First the new position of the glider is set to the new mouse position
            this.drag_obj[i].setPositionDirectly(JXG.COORDS_BY_USER,newPos.usrCoords[1],newPos.usrCoords[2]);
            // Then, from this position we compute the projection to the object the glider on which the glider lives.
            if(this.drag_obj[i].slideObject.type == JXG.OBJECT_TYPE_CIRCLE) {
                this.drag_obj[i].coords = JXG.Math.Geometry.projectPointToCircle(this.drag_obj[i], this.drag_obj[i].slideObject, this);
            } else if (this.drag_obj[i].slideObject.type == JXG.OBJECT_TYPE_LINE) {
                this.drag_obj[i].coords = JXG.Math.Geometry.projectPointToLine(this.drag_obj[i], this.drag_obj[i].slideObject, this);
            }
            // Now, we have to adjust the other group elements again.
            if(this.drag_obj[i].group.length != 0) {
                this.drag_obj[i].group[this.drag_obj[i].group.length-1].dX = this.drag_obj[i].coords.scrCoords[1] - oldCoords.scrCoords[1];
                this.drag_obj[i].group[this.drag_obj[i].group.length-1].dY = this.drag_obj[i].coords.scrCoords[2] - oldCoords.scrCoords[2];
                this.drag_obj[i].group[this.drag_obj[i].group.length-1].update(this);
            } else {
                this.update(this.drag_obj[i]);
            }
        }
        this.updateInfobox(this.drag_obj[i]);
//	}
    }
    else { // BOARD_MODE_NONE or BOARD_MODE_CONSTRUCT
        // Elements  below the mouse pointer which are not highlighted are highlighted.
        for(el in this.objects) {
            pEl = this.objects[el];
            if( pEl.hasPoint!=undefined && pEl.visProp['visible'] && pEl.hasPoint(dx, dy)) {
                //this.renderer.highlight(pEl);

                // this is required in any case because otherwise the box won't be shown until the point is dragged
                this.updateInfobox(pEl);
                if(this.highlightedObjects[el] == null) { // highlight only if not highlighted
                    pEl.highlight();
                    this.highlightedObjects[el] = pEl;
                }
            }
        }
    }
    this.updateQuality = this.BOARD_QUALITY_HIGH;
};

/**
 * Updates and displays a little info box to show coordinates of current selected points.
 * @param {JXG.GeometryElement} el A GeometryElement
 * @private
 */
JXG.Board.prototype.updateInfobox = function(el) {
    var x, y, xc, yc;
    if (!el.showInfobox) {
        return this;
    }
    if (el.elementClass == JXG.OBJECT_CLASS_POINT) {
        xc = el.coords.usrCoords[1]*1;
        yc = el.coords.usrCoords[2]*1;
        this.infobox.setCoords(xc+this.infobox.distanceX/(this.stretchX),
                               yc+this.infobox.distanceY/(this.stretchY));
        if (typeof(el.infoboxText)!="string") {
            x = Math.abs(xc);
            if (x>0.1) {
                x = xc.toFixed(2);
            } else if (x>=0.01) {
                x = xc.toFixed(4);
            } else if (x>=0.0001) {
                x = xc.toFixed(6);
            } else {
                x = xc;
            }
            y = Math.abs(yc);
            if (y>0.1) {
                y = yc.toFixed(2);
            } else if (y>=0.01) {
                y = yc.toFixed(4);
            } else if (y>=0.0001) {
                y = yc.toFixed(6);
            } else {
                y = yc;
            }

            this.highlightInfobox(x,y,el);
        }
        else
            this.highlightCustomInfobox(el.infoboxText,el);

        this.renderer.show(this.infobox);
        this.renderer.updateText(this.infobox);
    }
    return this;
};

JXG.Board.prototype.highlightCustomInfobox = function(text,el) {
    this.infobox.setText('<span style="color:#bbbbbb;">' + text + '</span>');
    return this;
};

JXG.Board.prototype.highlightInfobox = function(x,y,el) {
    this.highlightCustomInfobox('(' + x + ', ' + y + ')');
    return this;
};

/**
 * Remove highlighting of all elements.
 * @private
 */
JXG.Board.prototype.dehighlightAll = function(x,y) {
    var el, pEl;

    for(el in this.highlightedObjects) {
        //this.renderer.noHighlight(this.highlightedObjects[el]);
        pEl = this.highlightedObjects[el];
        if((pEl.hasPoint == undefined) ||
           (!pEl.hasPoint(x, y)) ||
           (!pEl.visProp['visible'])) { // dehighlight only if necessary
                pEl.noHighlight();
                delete(this.highlightedObjects[el]);
        }
    }
    return this;
};

/**
 * In case of snapToGrid activated this method caclulates the screen coords of mouse "snapped to grid".
 * @param {int} x X coordinate in screen coordinates
 * @param {int} y Y coordinate in screen coordinates
 */
JXG.Board.prototype.getScrCoordsOfMouse = function (x,y) {
    if(this.snapToGrid) {
        var newCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x,y], this);
        newCoords.setCoordinates(JXG.COORDS_BY_USER,
            [Math.round((newCoords.usrCoords[1])*this.snapSizeX)/this.snapSizeX,
             Math.round((newCoords.usrCoords[2])*this.snapSizeY)/this.snapSizeY]);
        return [newCoords.scrCoords[1], newCoords.scrCoords[2]];
    } else {
        return [x,y];
    }
};

/**
 * In case of snapToGrid activated this method caclulates the user coords of mouse "snapped to grid".
 * @param {Event} Evt Event object containing the mouse coordinates.
 */
JXG.Board.prototype.getUsrCoordsOfMouse = function (Evt) {
    var cPos = this.getRelativeMouseCoordinates(Evt);
    //var x = Event.pointerX(Evt) - cPos[0];
    //var y = Event.pointerY(Evt) - cPos[1];
    var absPos = JXG.getPosition(Evt);
    var x = absPos[0]-cPos[0]; //Event.pointerX(Evt) - cPos[0];
    var y = absPos[1]-cPos[1]; //Event.pointerY(Evt) - cPos[1];

    var newCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x,y], this);
    if(this.snapToGrid) {
        newCoords.setCoordinates(JXG.COORDS_BY_USER,
            [Math.round((newCoords.usrCoords[1])*this.snapSizeX)/this.snapSizeX,
             Math.round((newCoords.usrCoords[2])*this.snapSizeY)/this.snapSizeY]);
    }
    return [newCoords.usrCoords[1], newCoords.usrCoords[2]];
};

/**
 * Collects all elements under current mouse position plus current user coordinates of mouse cursor.
 * @param {Event} Evt Event object containing the mouse coordinates.
 * @type Array
 * @return Array of elements at the current mouse position plus current user coordinates of mouse.
 * @private
 */
JXG.Board.prototype.getAllUnderMouse = function (Evt) {
    var elList = this.getAllObjectsUnderMouse(Evt);
    elList.push(this.getUsrCoordsOfMouse(Evt));
    return elList;
    //return {"elList":elList, "coords":this.getUsrCoordsOfMouse(Evt)};
};

/**
 * Collects all elements under current mouse position.
 * @param {Event} Evt Event object containing the mouse coordinates.
 * @type Array
 * @return Array of elements at the current mouse position.
 * @private
 */
JXG.Board.prototype.getAllObjectsUnderMouse = function (Evt) {
    var cPos = this.getRelativeMouseCoordinates(Evt);

    // mouse position relative to container
    //var dx = Event.pointerX(Evt) - cPos[0];
    //var dy = Event.pointerY(Evt) - cPos[1];
    var absPos = JXG.getPosition(Evt);
    var dx = absPos[0]-cPos[0]; //Event.pointerX(Evt) - cPos[0];
    var dy = absPos[1]-cPos[1]; //Event.pointerY(Evt) - cPos[1];
    var elList = [];
    for (var el in this.objects) {
        if (this.objects[el].visProp['visible'] && this.objects[el].hasPoint(dx, dy)) {
            elList.push(this.objects[el]);
        }
    }
    return elList;
};

/**
 * Sets the board mode.
 * @param {int} mode The board mode the board should be set to. Possible values are
 * <li><ul>BOARD_MODE_NONE</ul><ul>BOARD_MODE_DRAG</ul><ul>BOARD_MODE_CONSTRUCT</ul><ul>BOARD_MODE_MOVE_ORIGIN</ul></li>
 * @private
 */
JXG.Board.prototype.setBoardMode = function (mode) {
    this.mode = mode;
    return this;
};

/**
 * Moves the origin and initializes an update of all elements.
 * @private
 */
JXG.Board.prototype.moveOrigin = function () {
    var el, ob;
    for (ob in this.objects) {
        el = this.objects[ob];
        if (!el.frozen && (el.elementClass==JXG.OBJECT_CLASS_POINT ||
            el.elementClass==JXG.OBJECT_CLASS_CURVE ||
            el.type==JXG.OBJECT_TYPE_AXIS ||
            el.type==JXG.OBJECT_TYPE_TEXT)) {
            if (el.elementClass!=JXG.OBJECT_CLASS_CURVE && el.type!=JXG.OBJECT_TYPE_AXIS)
                el.coords.usr2screen();
        }
    }

    this.clearTraces();

    this.fullUpdate();
    if(this.hasGrid) {
        this.renderer.removeGrid(this);
        this.renderer.drawGrid(this);
    }
    return this;
};

/**
 * After construction of the object the visibility is set
 * and the label is constructed if necessary.
 * @param {Object} obj The object to add.
 * @private
 */
JXG.Board.prototype.finalizeAdding = function (obj) {
    if (obj.hasLabel) {
        this.renderer.drawText(obj.label.content);
    }
    if(!obj.visProp['visible']) {
        this.renderer.hide(obj);
    }

    if(obj.hasLabel && !obj.label.content.visProp['visible']) {
        this.renderer.hide(obj.label.content);
    }
};

/**
 * Registers a point at the board and adds it to the renderer.
 * @param {JXG.Point} obj The point to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addPoint = function (obj) {
    //this.elementsByName[obj.name] = obj;
    var id = this.setId(obj,'P');
    this.renderer.drawPoint(obj);
    this.finalizeAdding(obj);
    return id;
};

/**
 * Registers a line at the board and adds it to the renderer.
 * @param {JXG.Line} obj The line to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addLine = function (obj) {
    var id = this.setId(obj,'L');
    this.renderer.drawLine(obj);
    this.finalizeAdding(obj);
    return id;
};

/**
 * Registers a circle at the board and adds it to the renderer.
 * @param {JXG.Circle} obj The circle to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addCircle = function(obj) {
    var id = this.setId(obj,'C');
    this.renderer.drawCircle(obj);
    this.finalizeAdding(obj);
    return id;
};

/**
 * Registers a polygon at the board and adds it to the renderer.
 * @param {JXG.Polygon} obj The polygon to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addPolygon = function(obj) {
    var id = this.setId(obj,'Py');
    this.renderer.drawPolygon(obj);
    this.finalizeAdding(obj);
    return id;
};

/**
 * Registers a curve at the board and adds it to the renderer.
 * @param {JXG.Curve} obj The curve to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addCurve = function (obj) {
    var id = this.setId(obj,'G');
    this.renderer.drawCurve(obj);
    this.finalizeAdding(obj);
    return id;
};

/**
 * Registers a chart at the board and adds it to the renderer.
 * @param {JXG.Chart} obj The chart to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addChart = function (obj) {
    return this.setId(obj,'Chart');
};

/**
 * Registers an intersection at the board and adds it to the renderer.
 * @param {JXG.Intersection} obj The intersection to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addIntersection = function (obj) {
    var number = this.numObjects;
    this.numObjects++;
    var elementId = obj.id;

    // Falls Id nicht vergeben, eine neue generieren:
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'I' + number;
    }

    // Objekt in das assoziative Array einfuegen
    this.objects[elementId] = obj;

    obj.id = elementId;

    obj.intersect1.addChild(obj);
    obj.intersect2.addChild(obj);

    return elementId;
};

/**
 * Registers a text at the board and adds it to the renderer.
 * @param {JXG.Text} obj The text to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addText = function (obj) {
    var number = this.numObjects;
    this.numObjects++;

    // Falls Id nicht vergeben, eine Neue generieren:
    var elementId = obj.id;
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'T' + number;
    }

    // Objekt in das assoziative Array einfuegen
    this.objects[elementId] = obj;

    // Objekt an den Renderer zum Zeichnen uebergeben
    obj.id = elementId;
    if(!obj.isLabel) {
        this.renderer.drawText(obj);
        if(!obj.visProp['visible']) {
            this.renderer.hide(obj);
        }
    }

    return elementId;
};

/**
  * Add conditional updates to the elements.
  * @param {string} str String containing coniditional update in geonext syntax
  */
JXG.Board.prototype.addConditions = function (str) {
    var res = null;
    var plaintext = 'var el,x,y,c;\n';
    var i = str.indexOf('<data>');
    var j = str.indexOf('</data>');
    if (i<0) {
        return;
    }
    while (i>=0) {
        var term = str.slice(i+6,j); // throw away <data>
        var m = term.indexOf('=');
        var left = term.slice(0,m);
        var right = term.slice(m+1);
        m = left.indexOf('.'); // Dies erzeugt Probleme bei Variablennamen der Form " Steuern akt."
        var name = left.slice(0,m);    //.replace(/\s+$/,''); // do NOT cut out name (with whitespace)
        var el = this.elementsByName[JXG.unescapeHTML(name)];

        var property = left.slice(m+1).replace(/\s+/g,'').toLowerCase(); // remove whitespace in property
        right = JXG.GeonextParser.geonext2JS(right, this);
        right = right.replace(/this\.board\./g,'this.');

        // Debug
        if (typeof this.elementsByName[name]=='undefined'){
            alert("debug conditions: |"+name+"| undefined");
        }
        plaintext += "el = this.objects[\"" + el.id + "\"];\n";
        //plaintext += "if (el==undefined) { $('debug').value = \"" + name + "\"; } else {\n";
        switch (property) {
            case 'x':
                plaintext += 'var y=el.coords.usrCoords[2];\n';  // y stays
                //plaintext += 'el.coords=new JXG.Coords(JXG.COORDS_BY_USER,['+(right) +',y],this);\n';
                plaintext += 'el.setPositionDirectly(JXG.COORDS_BY_USER,'+(right) +',y);\n';
                plaintext += 'el.update();\n';
                break;
            case 'y':
                plaintext += 'var x=el.coords.usrCoords[1];\n';  // x stays
                plaintext += 'el.coords=new JXG.Coords(JXG.COORDS_BY_USER,[x,'+(right)+'],this);\n';
                //plaintext += 'el.update();\n';
                break;
            case 'visible':
                plaintext += 'var c='+(right)+';\n';
                plaintext += 'if (c) {el.showElement();} else {el.hideElement();}\n';
                break;
            case 'position':
                plaintext += 'el.position = ' + (right) +';\n';
                plaintext += 'el.update();\n';
                //plaintext += 'this.updateElements();\n';
                break;
            case 'stroke':
                plaintext += 'el.strokeColor = ' + (right) +';\n';
                break;
            case 'style':
                plaintext += 'el.setStyle(' + (right) +');\n';
                break;
            case 'strokewidth':
                plaintext += 'el.strokeWidth = ' + (right) +';\n';   // wird auch bei Punkten verwendet, was nicht realisiert ist.
                //plaintext += 'el.highlightStrokeWidth = ' + (right) +';\n'; // TODO ?(BV)
                break;
            case 'fill':
                plaintext += 'var f='+(right)+';\n';
                plaintext += 'el.setProperty({fillColor:f})\n';
                break;
            case 'label':
                //plaintext += 'var color = ' + (right) +';\n';
                //plaintext += 'el.setProperty("labelColor:color");\n';
                break;
            default:
                alert("property '" + property + "' in conditions not yet implemented:" + right);
                break;
        }
        //plaintext += "}\n";
        str = str.slice(j+7); // cut off "</data>"
        i = str.indexOf('<data>');
        j = str.indexOf('</data>');
    }
    plaintext += 'this.prepareUpdate();\n';
    plaintext += 'this.updateElements();\n';
    plaintext += 'return true;\n';
    //alert(plaintext);
    this.updateConditions = new Function(plaintext);
    this.updateConditions();
};

/**
 * Computes the commands in the conditions-section of the gxt file.
 * It is evaluated after an update, before the unsuspendRedraw.
 * The function is generated in @see #addConditions
 * @private
 */
JXG.Board.prototype.updateConditions = function() { return false; };

/**
 * Registers an image at the board and adds it to the renderer.
 * @param {JXG.Image} obj The image to add.
 * @type String
 * @return Element id of the object.
 * @private
 */
JXG.Board.prototype.addImage = function (obj) {
    var number = this.numObjects;
    this.numObjects++;
    var elementId = obj.id;

    // Falls Id nicht vergeben, eine neue generieren:
    if((elementId == '') || (elementId == null)) {
        elementId = this.id + 'Im' + number;
    }

    // Objekt in die assoziativen Arrays einfuegen
    this.objects[elementId] = obj;
    this.elementsByName[obj.name] = obj;

    // Objekt an den Renderer zum Zeichnen uebergeben
    obj.id = elementId;

    this.renderer.drawImage(obj);
    if(!obj.visProp['visible']) {
       this.renderer.hide(obj);
    }

    return elementId;
};

/**
 * Calculates adequate snap sizes.
 * @private
 */
JXG.Board.prototype.calculateSnapSizes = function() {
    var p1 = new JXG.Coords(JXG.COORDS_BY_USER,[0,0],this),
        p2 = new JXG.Coords(JXG.COORDS_BY_USER,[1/this.gridX,1/this.gridY],this),
        x = p1.scrCoords[1]-p2.scrCoords[1],
        y = p1.scrCoords[2]-p2.scrCoords[2];

    this.snapSizeX = this.gridX;
    while(Math.abs(x) > 25) {
        this.snapSizeX *= 2;
        x /= 2;
    }

    this.snapSizeY = this.gridY;
    while(Math.abs(y) > 25) {
        this.snapSizeY *= 2;
        y /= 2;
    }
    return this;
};

/**
 * Apply update on all objects with the
 * new zoom-factors.
 * @private
 */
JXG.Board.prototype.applyZoom = function() {
    var el, ob;
    for(ob in this.objects) {
        el = this.objects[ob];
        if(!el.frozen && (el.elementClass==JXG.OBJECT_CLASS_POINT ||
            el.elementClass==JXG.OBJECT_CLASS_CURVE ||
            el.type==JXG.OBJECT_TYPE_AXIS ||
            el.type==JXG.OBJECT_TYPE_TEXT)) {
            if(el.elementClass!=JXG.OBJECT_CLASS_CURVE && el.type!=JXG.OBJECT_TYPE_AXIS)
                el.coords.usr2screen();
        }
    }
    this.calculateSnapSizes();

    this.clearTraces();

    this.fullUpdate();
    if(this.hasGrid) {
        this.renderer.removeGrid(this);
        this.renderer.drawGrid(this);
    }
    return this;
};

/**
 * Zooms into the board.
 */
JXG.Board.prototype.zoomIn = function() {
    var oX, oY;
    this.zoomX *= this.options.zoom.factor;
    this.zoomY *= this.options.zoom.factor;
    oX = this.origin.scrCoords[1]*this.options.zoom.factor;
    oY = this.origin.scrCoords[2]*this.options.zoom.factor;
    this.origin = new JXG.Coords(JXG.COORDS_BY_SCREEN, [oX, oY], this);
    this.stretchX = this.zoomX*this.unitX;
    this.stretchY = this.zoomY*this.unitY;
    this.applyZoom();
    return this;
};

/**
 * Zooms out of the board.
 */
JXG.Board.prototype.zoomOut = function() {
    var oX, oY;
    this.zoomX /= this.options.zoom.factor;
    this.zoomY /= this.options.zoom.factor;
    oX = this.origin.scrCoords[1]/this.options.zoom.factor;
    oY = this.origin.scrCoords[2]/this.options.zoom.factor;
    this.origin = new JXG.Coords(JXG.COORDS_BY_SCREEN, [oX, oY], this);

    this.stretchX = this.zoomX*this.unitX;
    this.stretchY = this.zoomY*this.unitY;
    this.applyZoom();
    return this;
};

/**
 * Resets zoom factor zu 1.
 */
JXG.Board.prototype.zoom100 = function() {
    var oX, oY, zX, zY;

    zX = this.zoomX;
    zY = this.zoomY;
    this.zoomX = 1.0;
    this.zoomY = 1.0;

    oX = this.origin.scrCoords[1]/zX;
    oY = this.origin.scrCoords[2]/zY;
    this.origin = new JXG.Coords(JXG.COORDS_BY_SCREEN, [oX, oY], this);

    this.stretchX = this.zoomX*this.unitX;
    this.stretchY = this.zoomY*this.unitY;
    this.applyZoom();
    return this;
};

/**
 * Zooms the board so every visible point is shown. Keeps aspect ratio.
 */
JXG.Board.prototype.zoomAllPoints = function() {
    var ratio, minX, maxX, minY, maxY, el,
        border, borderX, borderY, distX, distY, newZoom, newZoomX, newZoomY,
        newOriginX, newOriginY;

    ratio = this.zoomX / this.zoomY;
    minX = 0; // (0,0) soll auch sichtbar bleiben
    maxX = 0;
    minY = 0;
    maxY = 0;
    for(el in this.objects) {
        if( (this.objects[el].elementClass == JXG.OBJECT_CLASS_POINT) &&
            this.objects[el].visProp['visible']) {
            if(this.objects[el].coords.usrCoords[1] < minX) {
                minX = this.objects[el].coords.usrCoords[1];
            } else if(this.objects[el].coords.usrCoords[1] > maxX) {
                maxX = this.objects[el].coords.usrCoords[1];
            }
            if(this.objects[el].coords.usrCoords[2] > maxY) {
                maxY = this.objects[el].coords.usrCoords[2];
            } else if(this.objects[el].coords.usrCoords[2] < minY) {
                minY = this.objects[el].coords.usrCoords[2];
            }
        }
    }
    border = 50;
    borderX = border/(this.unitX*this.zoomX);
    borderY = border/(this.unitY*this.zoomY);

    distX = maxX - minX + 2*borderX;
    distY = maxY - minY + 2*borderY;

    newZoom = Math.min(this.canvasWidth/(this.unitX*distX), this.canvasHeight/(this.unitY*distY));
    newZoomY = newZoom;
    newZoomX = newZoom*ratio;

    newOriginX = -(minX-borderX)*this.unitX*newZoomX;
    newOriginY = (maxY+borderY)*this.unitY*newZoomY;
    this.origin = new JXG.Coords(JXG.COORDS_BY_SCREEN, [newOriginX, newOriginY], this);
    this.zoomX = newZoomX;
    this.zoomY = newZoomY;
    this.stretchX = this.zoomX*this.unitX;
    this.stretchY = this.zoomY*this.unitY;

    this.applyZoom();
    return this;
};

/**
 * Removes object from board and renderer.
 * @param {GeometryElement} object The object to remove.
 */
JXG.Board.prototype.removeObject = function(object) {
    var el, i;

    if(JXG.isArray(object)) {
        for(i=0; i<object.length; i++)
            this.removeObject(object[i]);
    }

    object = JXG.getReference(this, object);

    /* Wenn weder die ID noch der Name des Objekts bekannt ist, einfach wieder zurueckgehen */
    if(object == undefined) {
        return this;
    }

    try{
        /* Alle Kinder entfernen */
        for(el in object.childElements) {
            object.childElements[el].board.removeObject(object.childElements[el]);
        }

        for(el in this.objects) {
            if(typeof this.objects[el].childElements != 'undefined')
                delete(this.objects[el].childElements[object.id]);
        }

        /* Das Objekt selbst aus board.objects und board.elementsByName loeschen */
        delete(this.objects[object.id]);
        delete(this.elementsByName[object.name]);

        /* Alles weitere erledigt das Objekt selbst fuer uns. Ist sinnvoller, weil man sonst wieder unterscheiden muesste, was das fuer ein Objekt ist. */
        if(object.remove != undefined) object.remove();
    } catch(e) {
//        alert(object.id + ': Could not be removed, JS says:\n\n' + e);
    }
    return this;
};

/**
 * Initialise some objects which are contained in every GEONExT construction by default,
 * but are not contained in the gxt files.
 * @private
 */
JXG.Board.prototype.initGeonextBoard = function() {
    var p1, p2, p3, l1, l2;

    p1 = new JXG.Point(this, [0,0],this.id + 'gOOe0','Ursprung',false);
    p1.fixed = true;
    p2 = new JXG.Point(this, [1,0],this.id + 'gXOe0','Punkt_1_0',false);
    p2.fixed = true;
    p3 = new JXG.Point(this, [0,1],this.id + 'gYOe0','Punkt_0_1',false);
    p3.fixed = true;
    l1 = new JXG.Line(this, this.id + 'gOOe0', this.id + 'gXOe0', this.id + 'gXLe0','X-Achse', false);
    l1.hideElement();
    l2 = new JXG.Line(this, this.id + 'gOOe0', this.id + 'gYOe0', this.id + 'gYLe0','Y-Achse', false);
    l2.hideElement();
    return this;
};

/**
 * Initialise the info box object which is used to display
 * the coordinates of points under the mouse pointer,
 * @private
 */
JXG.Board.prototype.initInfobox= function() {
    //this.infobox = new JXG.Label(this, '0,0', new JXG.Coords(JXG.COORDS_BY_USER, [0, 0], this), this.id + '__infobox');
    this.infobox = new JXG.Text(this, '0,0', '', [0,0], this.id + '__infobox',null, null, false, 'html');
    this.infobox.distanceX = -20;
    this.infobox.distanceY = 25;
    //this.renderer.drawText(this.infobox);
    this.renderer.hide(this.infobox);
    return this;
};

/**
 * Change the height and width of the board's container.
 * @param {int} canvasWidth New width of the container.
 * @param {int} canvasHeight New height of the container.
 */
JXG.Board.prototype.resizeContainer = function(canvasWidth, canvasHeight) {
    this.canvasWidth = 1*canvasWidth;
    this.canvasHeight = 1*canvasHeight;
    this.containerObj.style.width = (this.canvasWidth) + 'px';
    this.containerObj.style.height = (this.canvasHeight) + 'px';
    return this;
};

/**
 * Lists the dependencies graph in a new HTML-window.
 */
JXG.Board.prototype.showDependencies = function() {
    var el, t, c, f, i;

    t = '<p>\n';
    for (el in this.objects) {
        i = 0;
        for (c in this.objects[el].childElements) {
            i++;
        }
        if (i>=0) {
            t += '<b>' + this.objects[el].id + ':</b> ';
        }
        for (c in this.objects[el].childElements) {
            t += this.objects[el].childElements[c].id+'('+this.objects[el].childElements[c].name+')'+', ';
        }
        t += '<p>\n';
    }
    t += '</p>\n';
    f = window.open();
    f.document.open();
    f.document.write(t);
    f.document.close();
    return this;
};

/**
 * Lists the XML code of the construction in a new HTML-window.
 */
JXG.Board.prototype.showXML = function() {
    var f = window.open("");
    f.document.open();
    f.document.write("<pre>"+JXG.escapeHTML(this.xmlString)+"</pre>");
    f.document.close();
    return this;
};

/**
 * Sets for all objects the needsUpdate flag to "true".
 * @param {Object,String} drag Element that caused the update.
 * @private
 */
JXG.Board.prototype.prepareUpdate = function(drag) {
    var el;
    for(el in this.objects) {
       this.objects[el].needsUpdate = true;
    }
    return this;
};

/**
  * Runs through all elements and calls their update() method.
  * @param {Object,String} drag Element that caused the update.
  * @private
  */
JXG.Board.prototype.updateElements = function(drag) {
    var el, pEl,
        isBeforeDrag = true; // If possible, we start the update at the dragged object.

    drag = JXG.getReference(this, drag);
    if (drag==null) {
        isBeforeDrag = false;
    }

    for(el in this.objects) {
        pEl = this.objects[el];
        if (drag!=null && pEl.id != drag.id) {
            isBeforeDrag = false;
        }
        if (!(isBeforeDrag || this.needsFullUpdate || pEl.needsRegularUpdate)) { continue; }
        if (drag==null || pEl.id!=drag.id) {
            //if (this.needsFullUpdate) { pEl.update(true); }
            pEl.update(true);
        } else {
            pEl.update(false);
        }
    }
    return this;
};

/**
  * Runs through all elements and calls their update() method.
  * @param {Object,String} drag Element that caused the update.
  * @private
  */
JXG.Board.prototype.updateRenderer = function(drag) {
    var el, pEl;
    drag = JXG.getReference(this, drag);
    for(el in this.objects) {
        pEl = this.objects[el];
        if (!this.needsFullUpdate && !pEl.needsRegularUpdate) { continue; }
        if (drag == null || pEl.id != drag.id) {
            //if (this.needsFullUpdate) { pEl.updateRenderer(); }
            pEl.updateRenderer();
        } else {
            pEl.updateRenderer();
        }
    }
    return this;
};

/**
  * Adds a hook to this board.
  * @param {function} hook A function to be called by the board after an update occured.
 * @param {string} m When the hook is to be called. Possible values are <i>mouseup</i>, <i>mousedown</i> and <i>update</i>.
  * @type int
  * @return Id of the hook, required to remove the hook from the board.
  */
JXG.Board.prototype.addHook = function(hook, m) {
    if(typeof m == 'undefined')
        m = 'update';

    this.hooks.push({fn: hook, mode: m});

    if(m=='update')
        hook(this);

    return (this.hooks.length-1);
};

/**
  * Deletes a hook from this board.
  * @param {int} id Id for the hook, required to delete the hook.
  */
JXG.Board.prototype.removeHook = function(id) {
    this.hooks[id] = null;
    return this;
};

/**
  * Runs through all hooked functions and calls them.
  * @private
  */
JXG.Board.prototype.updateHooks = function(m) {
    var i;

    if(typeof m == 'undefined')
        m = 'update';

    for(i=0; i<this.hooks.length; i++) {
        if((this.hooks[i] != null) && (this.hooks[i].mode == m))
            this.hooks[i].fn(this);
    }
    return this;
};

/**
  * Adds a dependent board to this board.
  * @param {object}  A reference to board which will be updated after an update of this board occured.
  */
JXG.Board.prototype.addChild = function(board) {
    this.dependentBoards.push(board);
    this.update();
    return this;
};

/**
  * Deletes a board from the list of dependent boards.
  * @param {object} board Reference to the board which will be removed.
  */
JXG.Board.prototype.removeChild = function(board) {
    var i;
    for (i=this.dependentBoards.length-1; i>=0; i--) {
        if (this.dependentBoards[i] == board) {
            this.dependentBoards.splice(i,1);
        }
    }
    return this;
};

/**
  * Runs through most elements and calls their
  * update() method and update the conditions.
  * @param {Object,String} drag Element that caused the update.
  */
JXG.Board.prototype.update = function(drag) {
    var i, len, boardId, b;

    if (this.isSuspendedUpdate) { return this; }
    this.prepareUpdate(drag).updateElements(drag).updateConditions();
    this.renderer.suspendRedraw();
    this.updateRenderer(drag);
    this.renderer.unsuspendRedraw();
    this.updateHooks();

    // To resolve dependencies between boards
    //for(var board in JXG.JSXGraph.boards) {
    len = this.dependentBoards.length;
    for (i=0; i<len; i++) {
        boardId = this.dependentBoards[i].id;
        b = JXG.JSXGraph.boards[boardId];
        if( b != this) {
            b.updateQuality = this.updateQuality;
            b.prepareUpdate(drag).updateElements(drag).updateConditions();
            b.renderer.suspendRedraw();
            b.updateRenderer(drag);
            b.renderer.unsuspendRedraw();
            b.updateHooks();
        }

    }
    return this;
};

/**
  * Runs through all elements and calls their
  * update() method and update the conditions.
  * This is necessary after zooming and changing the bounding box.
  */
JXG.Board.prototype.fullUpdate = function() {
    this.needsFullUpdate = true;
    this.update();
    this.needsFullUpdate = false;
    return this;
};

/**
 * Creates a new geometric element of type elementType.
 * @param {string} elementType Type of the element to be constructed given as a string e.g. 'point' or 'circle'.
 * @param {Array} parents Array of parent elements needed to construct the element e.g. coordinates for a point or two
 * points to construct a line. This highly depends on the elementType that is constructed. See the corresponding JXG.create*
 * methods for a list of possible parameters.
 * @param {Object} attributes An object containing the attributes to be set. This also depends on the elementType.
 * Common attributes are name, visible, strokeColor. @see GeometryElement#setProperty
 * @type Object
 * @return Reference to the created element.
 */
JXG.Board.prototype.createElement = function(elementType, parents, attributes) {
    var el, i, s;

    // CM: AW:
    if (elementType!='turtle' && (parents == null || parents.length == 0)) {  // Turtle may have no parent elements
        return null;
    }
    if (parents == null) { parents = []; }

    elementType = elementType.toLowerCase();

    if (attributes==null) {
        attributes = {};
    }
    for (i=0; i<parents.length; i++) {
        parents[i] = JXG.getReference(this, parents[i]); // TODO: should not be done for content-parameter of JXG.Text
    }

    if(JXG.JSXGraph.elements[elementType] != null) {
	if(typeof JXG.JSXGraph.elements[elementType] == 'function') {
            el = JXG.JSXGraph.elements[elementType](this, parents, attributes);
        } else {
            el = JXG.JSXGraph.elements[elementType].creator(this, parents, attributes);
        }
    } else {
        throw new Error("JSXGraph: JXG.createElement: Unknown element type given: "+elementType);
    }

    if (typeof el == 'undefined') {
        //throw new Error("JSXGraph: JXG.createElement: failure creating "+elementType);
        return el;
    };

    if(JXG.isArray(attributes)) {
        attributes = attributes[0];
    }

//    try {
        if(el.multipleElements) {
            for(s in el) {
                if(typeof el[s].setProperty != 'undefined')
                    el[s].setProperty(attributes);
            }
        } else {
            if(typeof el.setProperty != 'undefined')
                el.setProperty(attributes);
        }

//    } catch (e) { alert("Error setting Property:" + e); };

//    if(!JXG.isArray(el)) {  // Default way of setting attributes: strings, arrays and objects are possible
//        el.setProperty(attributes);
//    }
/* AW: Doch erstmal wieder auskommentiert
    else {                  // Setting attributes of multiple objects simultaneously.  Here, only strings are possible
        for (var s in attributes) {
            for(var i=0; i<el.length; i++) {
                if(attributes[s][i] != null) {el[i].setProperty(s+':'+attributes[s][i]);}
            }
        }
    }
*/
/*
    for (var s in attributes) {
        if(!JXG.isArray(el)) {
            el.setProperty(s+':'+attributes[s]);
        }
        else {
            for(var i=0; i<el.length; i++) {
                if(attributes[s][i] != null) {
                    el[i].setProperty(s+':'+attributes[s][i]);
                }
            }
        }
    }
*/
    this.update(el); // We start updating at the newly created element. AW
    return el;
};

/**
 * Wrapper for {@link #createElement()}.
 */
JXG.Board.prototype.create = JXG.Board.prototype.createElement;

/**
 * Delete the elements drawn as part of a trace of an element.
 */
JXG.Board.prototype.clearTraces = function() {
    var el;

    for(el in this.objects) {
        if (this.objects[el].traced)
            this.objects[el].clearTrace();
    }
    return this;
};

/**
 * Method called before a board is initialized or load from a file. Currently unused.
 * @private
 */
JXG.Board.prototype.beforeLoad = function() {
/*    if(document.getElementsByTagName("body").length > 0) {
        var divNode = document.createElement("div");
        divNode.setAttribute("id", "JXGPreLoadAnimation");
        var imgNode = document.createElement("img");
        imgNode.setAttribute("src", "./css/load.gif");
        divNode.appendChild(imgNode);
        divNode.setStyle({
                    zIndex: 999,
                    position: 'absolute',
                    left: parseInt(JXG.getStyle(this.containerObj,"left")) + (this.canvasWidth - 100)/2,
                    top: parseInt(JXG.getStyle(this.containerObj,"top")) + (this.canvasHeight - 100)/2
                });

        document.getElementsByTagName("body")[0].appendChild(divNode);
    }*/
};

/**
 * Method called after a board got initialized or load from a file. Currently unused.
 * @private
 */
JXG.Board.prototype.afterLoad = function() {
  /*  if(document.getElementsByTagName("body").length > 0) {
        document.getElementsByTagName("body")[0].removeChild(document.getElementById("JXGPreLoadAnimation"));
    }*/
};

/**
 * Stop updates of the board.
 */
JXG.Board.prototype.suspendUpdate = function() {
    this.isSuspendedUpdate = true;
    return this;
};

/**
 * Enable updates of the board again.
 */
JXG.Board.prototype.unsuspendUpdate = function() {
    this.isSuspendedUpdate = false;
    this.update();
    return this;
};

/**
 * Set the bounding box of the board.
 * @param {Array} New bounding box [x1,y1,x2,y2]
 * @param {Bool} keepaspectratio: optional flag
 */
JXG.Board.prototype.setBoundingBox = function(bbox,keepaspectratio) {
    if (!JXG.isArray(bbox)) return;
    var h,w,oX,oY, dim;
    dim = JXG.getDimensions(this.container);

    this.canvasWidth = parseInt(dim.width);
    this.canvasHeight = parseInt(dim.height);
    w = this.canvasWidth;
    h = this.canvasHeight;
    if (keepaspectratio) {
        this.unitX = w/(bbox[2]-bbox[0]);
        this.unitY = h/(-bbox[3]+bbox[1]);
        if (this.unitX<this.unitY) {
            this.unitY = this.unitX;
        } else {
            this.unitX = this.unitY;
        }
    } else {
        this.unitX = w/(bbox[2]-bbox[0]);
        this.unitY = h/(-bbox[3]+bbox[1]);
    }
    oX = -this.unitX*bbox[0]*this.zoomX;
    oY = this.unitY*bbox[1]*this.zoomY;
    this.origin = new JXG.Coords(JXG.COORDS_BY_SCREEN, [oX, oY], this);
    this.stretchX = this.zoomX*this.unitX;
    this.stretchY = this.zoomY*this.unitY;

    this.moveOrigin();
    return this;
};

/**
 * General purpose animation function, currently only supporting moving points from one place to another. Is faster than
 * managing the animation per point, especially if there is more than one animated point at the same time.
 */
JXG.Board.prototype.animate = function() {
    var count = 0,
        el, o, newCoords, r, p, c,
        obj=null;

    //this.suspendUpdate();
    for(el in this.animationObjects) {
        if(this.animationObjects[el] == null)
            continue;

        count++;
        o = this.animationObjects[el];
        if(o.animationPath) {
            newCoords = o.animationPath.pop();
            if(typeof newCoords  == 'undefined') {
                delete(o.animationPath);
            } else {
                //o.setPositionByTransform(JXG.COORDS_BY_USER, newCoords[0] - o.coords.usrCoords[1], newCoords[1] - o.coords.usrCoords[2]);
                o.setPositionDirectly(JXG.COORDS_BY_USER, newCoords[0], newCoords[1]);
                //this.update(o);  // May slow down the animation, but is important
                                 // for dependent glider objects (see tangram.html).
                                 // Otherwise the intended projection may be incorrect.
                o.prepareUpdate().update().updateRenderer();
                obj = o;
            }
        }
        if(o.animationData) {
            c = 0;
            for(r in o.animationData) {
                p = o.animationData[r].pop();
                if(typeof p == 'undefined') {
                    delete(o.animationData[p]);
                } else {
                    c++;
                    o.setProperty(r + ':' + p);
                }
            }
            if(c==0)
                delete(o.animationData);
        }

        if(typeof o.animationData == 'undefined' && typeof o.animationPath == 'undefined') {
            this.animationObjects[el] = null;
            delete(this.animationObjects[el]);
        }
    }
    //this.unsuspendUpdate();

    if(count == 0) {
        window.clearInterval(this.animationIntervalCode);
        delete(this.animationIntervalCode);
    } else {
        this.update(obj);
//	window.setTimeout('JXG.JSXGraph.boards[\'' + this.id + '\'].animate();', 35);
    }
};

/**
 * @todo This doesn't work by now. Intention is, to just overwrite the color values for the rendering nodes, but not to call setProperty. Advantage
 * of the change-rendering-node approach would be that this could be reversed and after the user changing the color the new color would be
 * converted by the color blindness simulator, too.
 * Initializes color blindness simulation.
 * @param deficiency Describes the color blindness deficiency which is simulated. Accepted values are protanopia, deuteranopia, and tritanopia.
 * @private
 */
JXG.Board.prototype.emulateColorblindness = function(deficiency) {
    var e, o, brd=this;

    if(typeof deficiency == 'undefined')
        deficiency = 'none';

    if(this.currentCBDef == deficiency)
        return;

    for(e in brd.objects) {
        o = brd.objects[e];
        if(deficiency != 'none') {
            if(this.currentCBDef == 'none')
                o.visPropOriginal = JXG.deepCopy(o.visProp);
            o.setProperty({strokeColor: JXG.rgb2cb(o.visPropOriginal.strokeColor, deficiency), fillColor: JXG.rgb2cb(o.visPropOriginal.fillColor, deficiency),
                           highlightStrokeColor: JXG.rgb2cb(o.visPropOriginal.highlightStrokeColor, deficiency), highlightFillColor: JXG.rgb2cb(o.visPropOriginal.highlightFillColor, deficiency)});
        } else if(typeof o.visPropOriginal != 'undefined') {
            o.visProp = JXG.deepCopy(o.visPropOriginal);
        }
    }
    this.currentCBDef = deficiency;

    this.update();
};

/**
 * @param {String} string A string containing construction(s) in JSXGraph Construction Syntax.
 * @param {String} mode Possible values seem are "normal" or "macro"
 * @param {Array} params Parameters, only used in macro mode
 * @param {Array} paraIn Parameters, only used in macro mode
 * @param {String} macroName Name of the macro, only used in macro mode
 * @type object
 * @return An object consisting of several arrays (lines, circles, points, angles, ...) where the created elements are stored.
 */
JXG.Board.prototype.construct = function(string, mode, params, paraIn, macroName) {
    var splitted, i, first, last, j, output = {}, objName, defElements, obj, type, possibleNames, tmp, noMacro, k,l, pattern, createdNames, found,
        mac, prop, propName, propValue;
    if(typeof(mode) == "undefined") {
        mode = "normal";
    }
    else { // mode = 'macro'
        createdNames = [];
    }
    output.lines = [];
    output.circles = [];
    output.points = [];
    output.intersections = [];
    output.angles = [];
    output.macros = [];
    output.functions = [];
    output.texts = [];
    output.polygons = [];
    if(string.search(/\{/) != -1) { // Macros finden! Innerhalb der {} darf nicht am ; getrennt werden. Noch nicht getestet: mehrere Makros hintereinander in einem construct.
        tmp = string.match(/\{/);
        tmp = tmp.length;
        l=0;
        for(j=0; j<tmp; j++) {
            k = string.slice(l).search(/\{/);
            mac = string.slice(k);
            mac = mac.slice(0,mac.search(/\}/)+1);
            mac = mac.replace(/;/g,'?');   // Achtung! Fragezeichen duerfen daher nicht im Code eines Macros vorkommen!
            string = string.slice(0,k) + mac + string.slice(k+mac.length);
            l=k+1;
        }
    }
    splitted = string.split(';');
    for(i=0; i< splitted.length; i++) {
        // Leerzeichen am Anfang und am Ende entfernen
        splitted[i] = splitted[i].replace (/^\s+/, '').replace (/\s+$/, '');
        if(splitted[i].search(/\{/) != -1) {
            splitted[i] = splitted[i].replace(/\?/g,';');
        }
        if(splitted[i].search(/Macro/) != -1) {
            this.addMacro(splitted[i]);
        }
        else {
            if(splitted[i].length > 0) {
                prop = false;
                if(splitted[i].search(/=/) != -1) {
                    objName = splitted[i].split('=');
                    propValue = objName[1];
                    propValue = propValue.replace (/^\s+/, '').replace (/\s+$/, '');
                    if(objName[0].search(/\./) != -1) {
                        prop = true;
                    
                        objName = objName[0].split('.');
                        propName = objName[objName.length-1];
                        propName = propName.replace (/^\s+/, '').replace (/\s+$/, '');
                        objName.pop();
                        objName = objName.join(".");
                        if(mode == 'macro') {
                            for(j=0; j<params.length; j++) {
                                if(objName == params[j]) {
                                    objName = paraIn[j];
                                }
                            }
                        }                    
                        //alert("_"+objName+"_"+propName+"_"+propValue+"_");
                        //alert(JXG.getReference(this,objName).name);
                        JXG.getReference(this,objName).setProperty(propName+":"+propValue);
                        
                    }
                }
                if(!prop) { // nicht nur eine Eigenschaft setzen, sondern neues Element konstruieren
                    if(splitted[i].search(/=/) != -1) {
                        objName = splitted[i].split('=');
                        splitted[i] = objName[1].replace (/^\s+/, ''); // Leerzeichen am Anfang entfernen
                        objName = objName[0].replace (/\s+$/, ''); // Leerzeichen am Ende entfernen
                    }
                    else {
                        objName = '';
                    }
                    attributes = {};
                    found = true;
                    while(found) {
                        if(splitted[i].search(/(.*)draft$/) != -1) {
                            attributes.draft = true;
                            splitted[i] = RegExp.$1;
                            splitted[i] = splitted[i].replace (/\s+$/, ''); // Leerzeichen am Ende entfernen
                        }
                        if(splitted[i].search(/(.*)invisible$/) != -1) {
                            attributes.visible = false;
                            splitted[i] = RegExp.$1;
                            splitted[i] = splitted[i].replace (/\s+$/, ''); // Leerzeichen am Ende entfernen
                        }
                        if(splitted[i].search(/(.*)nolabel$/) != -1) {
                            attributes.withLabel = false;
                            splitted[i] = RegExp.$1;
                            splitted[i] = splitted[i].replace (/\s+$/, ''); // Leerzeichen am Ende entfernen
                        }
                        if(splitted[i].search(/nolabel|invisible|draft/) == -1) {
                            found = false;
                        }
                    }
                    noMacro = true;
                    if(this.definedMacros) {
                        for(j=0; j<this.definedMacros.macros.length; j++) {
                            pattern = new RegExp("^"+this.definedMacros.macros[j][0]+"\\s*\\(");
                            if(splitted[i].search(pattern) != -1) { // TODO: testen, was mit den Macros xxx und yxxx passiert
                                //alert("MACRO!"+splitted[i]+"_"+this.definedMacros.macros[j][2]);
                                noMacro = false;
                                // Parameter aufdroeseln
                                splitted[i].match(/\((.*)\)/);
                                tmp = RegExp.$1;
                                tmp = tmp.split(',');
                                for(k=0; k < tmp.length; k++) {
                                    tmp[k].match(/\s*(\S*)\s*/);
                                    tmp[k] = RegExp.$1;
                                }
                                output[objName] = this.construct(this.definedMacros.macros[j][2],'macro',this.definedMacros.macros[j][1], tmp, objName);
                                output.macros.push(output[objName]);
                                break;
                            }
                        }
                    }
                    if(noMacro) { // splitted[i] war kein Macro-Aufruf
                        if(splitted[i].search(/^[\[\]].*[\[\]]$/) != -1) { // Gerade, Halbgerade oder Segment
                            splitted[i].match(/([\[\]])(.*)([\[\]])/);
                            attributes.straightFirst = (RegExp.$1 != '[');
                            attributes.straightLast = (RegExp.$3 == '[');
                            defElements = (RegExp.$2).replace (/^\s+/, '').replace (/\s+$/, '');
                            if(defElements.search(/ /) != -1) {
                                defElements.match(/(\S*) +(\S*)/);
                                defElements = [];
                                defElements[0] = RegExp.$1;
                                defElements[1] = RegExp.$2;
                            } // sonst wird die Gerade durch zwei Punkte definiert, die einen Namen haben, der aus nur jeweils einem Buchstaben besteht
                            if(objName != '') {
                                if(attributes.withLabel == undefined) {
                                    attributes.withLabel = true;
                                }
                                attributes.name = objName;
                                if(mode == 'macro') {
                                    createdNames.push(objName);
                                }
                            }
                            if(mode == 'macro') {
                                if(macroName != '') {
                                    for(j=0; j<createdNames.length; j++) { // vorher oder nachher?
                                        if(defElements[0] == createdNames[j]) {
                                            defElements[0] = macroName+"."+defElements[0];
                                        }
                                        if(defElements[1] == createdNames[j]) {
                                            defElements[1] = macroName+"."+defElements[1];
                                        }
                                    }
                                }
                                for(j=0; j<params.length; j++) {
                                    if(defElements[0] == params[j]) {
                                        defElements = [paraIn[j], defElements[1]];
                                    }
                                    if(defElements[1] == params[j]) {
                                        defElements = [defElements[0], paraIn[j]];
                                    }
                                }
                                if(macroName != '') {
                                    attributes.id = macroName+"."+objName;
                                }
                            }
                            if(typeof defElements == 'string') {
                                defElements = [JXG.getReference(this,defElements.charAt(0)), JXG.getReference(this,defElements.charAt(1))];
                            }
                            else {
                                defElements = [JXG.getReference(this,defElements[0]), JXG.getReference(this,defElements[1])];
                            }
                            output.lines.push(this.createElement('line',
                                                    defElements,
                                                    attributes));
                            if(objName != '') {
                                output[objName] = output.lines[output.lines.length-1];
                            }
                        }
                        else if(splitted[i].search(/k\s*\(.*/) != -1) { // Kreis
                            splitted[i].match(/k\s*\(\s*(\S.*\S|\S)\s*,\s*(\S.*\S|\S)\s*\)/);
                            defElements = [];
                            defElements[0] = RegExp.$1;
                            defElements[1] = RegExp.$2;
                            for(j=0; j<=1; j++) {
                                if(defElements[j].search(/[\[\]]/) != -1) { // Linie, definiert durch [P_1 P_2] , ist bei den Parametern dabei
                                    defElements[j].match(/^[\[\]]\s*(\S.*\S)\s*[\[\]]$/);
                                    defElements[j] = RegExp.$1;
                                    if(defElements[j].search(/ /) != -1) {
                                        defElements[j].match(/(\S*) +(\S*)/);
                                        defElements[j] = [];
                                        defElements[j][0] = RegExp.$1;
                                        defElements[j][1] = RegExp.$2;
                                    } // sonst wird die Gerade durch zwei Punkte definiert, die einen Namen haben, der aus nur jeweils einem Buchstaben besteht
                                    if(mode == 'macro') {
                                        if(macroName != '') {
                                            for(k=0; k<createdNames.length; k++) { // vorher oder nachher?
                                                if(defElements[j][0] == createdNames[k]) {
                                                    defElements[j][0] = macroName+"."+defElements[j][0];
                                                }
                                                if(defElements[j][1] == createdNames[k]) {
                                                    defElements[j][1] = macroName+"."+defElements[j][1];
                                                }
                                            }
                                        }
                                        for(k=0; k<params.length; k++) {
                                            if(defElements[j][0] == params[k]) {
                                                defElements[j] = [paraIn[k], defElements[j][1]];
                                            }
                                            if(defElements[j][1] == params[k]) {
                                                defElements[j] = [defElements[j][0], paraIn[k]];
                                            }
                                        }
                                    }
                                    if(typeof defElements[j] == 'string') {
                                        defElements[j] = (function(el, board) { return function() {
                                                                    return JXG.getReference(board,el.charAt(0)).Dist(JXG.getReference(board,el.charAt(1))); // TODO
                                                               }}
                                                  )(defElements[j], this);
                                    }
                                    else {
                                        defElements[j] = (function(el, board) { return function() {
                                                                    return JXG.getReference(board,el[0]).Dist(JXG.getReference(board,el[1])); // TODO
                                                               }}
                                                  )(defElements[j], this);
                                    }
                                    
                                }
                                else if(defElements[j].search(/[0-9\.\s]+/) != -1){ // Radius als Zahl
                                    defElements[j] = 1.0*defElements[j];
                                }
                                else { // Element mit Name
                                    if(mode == 'macro') {
                                        if(macroName != '') {
                                            for(k=0; k<createdNames.length; k++) { // vorher oder nachher?
                                                if(defElements[j] == createdNames[k]) {
                                                    defElements[j] = macroName+"."+createdNames[k];
                                                }
                                            }
                                        }
                                        for(k=0; k<params.length; k++) {
                                            if(defElements[j] == params[k]) {
                                                defElements[j] = paraIn[k];
                                            }
                                        }
                                    }
                                    defElements[j] = JXG.getReference(this,defElements[j]);
                                }
                            }
                            if(objName != '') {
                                if(attributes.withLabel == undefined) {
                                    attributes.withLabel = true;
                                }
                                attributes.name = objName;
                                if(mode == 'macro') {
                                    if(macroName != '') {
                                        attributes.id = macroName+"."+objName;
                                    }
                                    createdNames.push(objName);
                                }
                            }
                            output.circles.push(this.createElement('circle',defElements,attributes));
                            if(objName != '') {
                                output[objName] = output.circles[output.circles.length-1];
                            }
                        }
                        else if(splitted[i].search(/^[A-Z]+.*\(\s*[0-9\.\-]+\s*[,\|]\s*[0-9\.\-]+\s*\)/) != -1
                                && splitted[i].search(/Macro\((.*)\)/) == -1) { // Punkt, startet mit einem Grossbuchstaben! (definiert durch Koordinaten)
                            splitted[i].match(/^([A-Z]+\S*)\s*\(\s*(.*)\s*[,\|]\s*(.*)\s*\)$/);
                            objName = RegExp.$1; // Name
                            attributes.name = objName;
                            if(mode == 'macro') {
                                if(macroName != '') {
                                    attributes.id = macroName+"."+objName;
                                }
                                createdNames.push(objName);
                            }
                            output.points.push(this.createElement('point',[1.0*RegExp.$2,1.0*RegExp.$3],attributes));
                            output[objName] = output.points[output.points.length-1];
                        }
                        else if(splitted[i].search(/^[A-Z]+.*\(.+(([,\|]\s*[0-9\.\-]+\s*){2})?/) != -1
                                && splitted[i].search(/Macro\((.*)\)/) == -1) { // Gleiter, mit oder ohne Koordinaten
                            splitted[i].match(/([A-Z]+.*)\((.*)\)/);
                            objName = RegExp.$1;
                            defElements = RegExp.$2;
                            objName = objName.replace (/^\s+/, '').replace (/\s+$/, '');
                            defElements = defElements.replace (/^\s+/, '').replace (/\s+$/, '');
                            if(defElements.search(/[,\|]/) != -1) { // Koordinaten angegeben
                                defElements.match(/(\S*)\s*[,\|]\s*([0-9\.]+)\s*[,\|]\s*([0-9\.]+)\s*/);
                                defElements = [];
                                defElements[0] = RegExp.$1;
                                defElements[1] = 1.0*RegExp.$2;
                                defElements[2] = 1.0*RegExp.$3;
                            }
                            else { // keine Koordinaten
                                obj = defElements;
                                defElements = [];
                                defElements[0] = obj; // Name des definierenden Elements
                                defElements[1] = 0; // (0,0) als Gleiterkoordinaten vorgeben...
                                defElements[2] = 0;
                            }
                            attributes.name = objName;
                            if(mode == 'macro') {
                                if(macroName != '') {
                                    for(k=0; k<createdNames.length; k++) { // vorher oder nachher?
                                        if(defElements[0] == createdNames[k]) {
                                            defElements[0] = macroName+"."+createdNames[k];
                                        }
                                    }
                                }
                                for(k=0; k<params.length; k++) {
                                    if(defElements[0] == params[k]) {
                                        defElements[0] = paraIn[k];
                                    }
                                }
                                if(macroName != '') {
                                    attributes.id = macroName+"."+objName;
                                }
                                createdNames.push(objName);
                            }
                            output.points.push(this.createElement('glider',
                                                                  [defElements[1],defElements[2],JXG.getReference(this,defElements[0])],
                                                                  attributes));
                            output[objName] = output.points[output.points.length-1];
                        }
                        else if(splitted[i].search(/&/) != -1) { // Schnittpunkt
                            splitted[i].match(/(.*)&(.*)/);
                            defElements = [];
                            defElements[0] = RegExp.$1;
                            defElements[1] = RegExp.$2;
                            defElements[0] = defElements[0].replace(/\s+$/, ''); // Leerzeichen am Ende entfernen
                            defElements[1] = defElements[1].replace (/^\s+/, ''); // Leerzeichen am Anfang entfernen
                            if(mode == 'macro') {
                                for(j=0; j<=1; j++) {
                                    if(macroName != '') {
                                        for(k=0; k<createdNames.length; k++) { // vorher oder nachher?
                                            if(defElements[j] == createdNames[k]) {
                                                defElements[j] = macroName+"."+createdNames[k];
                                            }
                                        }
                                    }
                                    for(k=0; k<params.length; k++) {
                                        if(defElements[j] == params[k]) {
                                            defElements[j] = paraIn[k];
                                        }
                                    }
                                }
                            }
                            defElements[0] = JXG.getReference(this,defElements[0]);
                            defElements[1] = JXG.getReference(this,defElements[1]);
                            if ((defElements[0].elementClass==JXG.OBJECT_CLASS_LINE || defElements[0].elementClass==JXG.OBJECT_CLASS_CURVE) &&
                                (defElements[1].elementClass==JXG.OBJECT_CLASS_LINE || defElements[1].elementClass==JXG.OBJECT_CLASS_CURVE)) {
                                if(objName != '') {
                                    attributes.name = objName;
                                    if(mode == 'macro') {
                                        if(macroName != '') {
                                            attributes.id = macroName+"."+objName;
                                        }
                                        createdNames.push(objName);
                                    }
                                }                          
                                obj = this.createElement('intersection',[defElements[0],defElements[1],0],attributes);
                                output.intersections.push(obj);
                                if(objName != '') {
                                    output[attributes.name] = obj;
                                }
                            }
                            else {
                                if(objName != '') {
                                    attributes.name = objName+"_1";
                                    if(mode == 'macro') {
                                        if(macroName != '') {
                                            attributes.id = macroName+"."+objName+"_1";
                                        }
                                        createdNames.push(objName+"_1");
                                    }
                                }
                                obj = this.createElement('intersection',[defElements[0],defElements[1],0],attributes);
                                output.intersections.push(obj);
                                if(objName != '') {
                                    output[attributes.name] = obj;
                                }
                                if(objName != '') {
                                    attributes.name = objName+"_2";
                                    if(mode == 'macro') {
                                        if(macroName != '') {
                                            attributes.id = macroName+"."+objName+"_2";
                                        }
                                        createdNames.push(objName+"_2");
                                    }
                                }
                                obj = this.createElement('intersection',[defElements[0],defElements[1],1],attributes);
                                output.intersections.push(obj);
                                if(objName != '') {
                                    output[attributes.name] = obj;
                                }
                            }
                        }
                        else if(splitted[i].search(/\|[\|_]\s*\(/) != -1) { // Parallele oder Senkrechte
                            splitted[i].match(/\|([\|_])\s*\(\s*(\S*)\s*,\s*(\S*)\s*\)/);
                            type = RegExp.$1;
                            if(type == '|') {
                                type = 'parallel';
                            }
                            else { // type == '_'
                                type = 'normal';
                            }
                            defElements = [];
                            defElements[0] = RegExp.$2;
                            defElements[1] = RegExp.$3;
                            if(mode == 'macro') {
                                for(j=0; j<=1; j++) {
                                    if(macroName != '') {
                                        for(k=0; k<createdNames.length; k++) { // vorher oder nachher?
                                            if(defElements[j] == createdNames[k]) {
                                                defElements[j] = macroName+"."+createdNames[k];
                                            }
                                        }
                                    }
                                    for(k=0; k<params.length; k++) {
                                        if(defElements[j] == params[k]) {
                                            defElements[j] = paraIn[k];
                                        }
                                    }
                                }
                            }
                            if(objName != '') {
                                attributes.name = objName;
                                if(attributes.withLabel == undefined) {
                                    attributes.withLabel = true;
                                }
                                if(mode == 'macro') {
                                    if(macroName != '') {
                                        attributes.id = macroName+"."+objName;
                                    }
                                    createdNames.push(objName);
                                }
                            }
                            output.lines.push(this.createElement(type,
                                                                 [JXG.getReference(this,defElements[0]),JXG.getReference(this,defElements[1])],
                                                                 attributes));

                            if(objName != '') {
                                output[objName] = output.lines[output.lines.length-1];
                            }
                        }
                        else if(splitted[i].search(/^</) != -1) { // Winkel
                            splitted[i].match(/<\s*\(\s*(\S*)\s*,\s*(\S*)\s*,\s*(\S*)\s*\)/);
                            defElements = [];
                            defElements[0] = RegExp.$1;
                            defElements[1] = RegExp.$2;
                            defElements[2] = RegExp.$3;
                            if(mode == 'macro') {
                                for(j=0; j<=2; j++) {
                                    if(macroName != '') {
                                        for(k=0; k<createdNames.length; k++) { // vorher oder nachher?
                                            if(defElements[j] == createdNames[k]) {
                                                defElements[j] = macroName+"."+createdNames[k];
                                            }
                                        }
                                    }
                                    for(k=0; k<params.length; k++) {
                                        if(defElements[j] == params[k]) {
                                            defElements[j] = paraIn[k];
                                        }
                                    }
                                }
                            }
                            if(objName == '') {
                                output.lines.push(this.createElement('angle',
                                                                    [JXG.getReference(this,defElements[0]),
                                                                     JXG.getReference(this,defElements[1]),
                                                                     JXG.getReference(this,defElements[2])],
                                                                     attributes));
                            }
                            else {
                                possibleNames = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
                                            'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho',
                                            'sigmaf', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'];
                                type = '';
                                for(j=0; j<possibleNames.length;j++) {
                                    if(objName == possibleNames[j]) {
                                        attributes.text = '&'+objName+';';
                                        attributes.name = '&'+objName+';';
                                        type = 'greek';
                                        break;
                                    }
                                    else {
                                        if(j == possibleNames.length -1) {
                                            attributes.text = objName;
                                            attributes.name = objName;
                                        }
                                    }
                                }
                                if(attributes.withLabel == undefined) {
                                    attributes.withLabel = true;
                                }
                                if(mode == 'macro') {
                                    if(macroName != '') {
                                        attributes.id = macroName+"."+objName;
                                    }
                                    createdNames.push(objName);
                                }
                                output.angles.push(this.createElement('angle',
                                                                     [JXG.getReference(this,defElements[0]),
                                                                      JXG.getReference(this,defElements[1]),
                                                                      JXG.getReference(this,defElements[2])],
                                                                     attributes));
                                output[objName] = output.angles[output.angles.length-1];
                            }
                        }
                        else if(splitted[i].search(/([0-9]+)\/([0-9]+)\(\s*(\S*)\s*,\s*(\S*)\s*\)/) != -1) { // Punkt mit Teilverhaeltnis, z.B. Mittelpunkt
                            defElements = [];
                            defElements[0] = 1.0*(RegExp.$1)/(1.0*(RegExp.$2));
                            defElements[1] = RegExp.$3;
                            defElements[2] = RegExp.$4;
                            if(mode == 'macro') {
                                for(j=1; j<=2; j++) {
                                    if(macroName != '') {
                                        for(k=0; k<createdNames.length; k++) { // vorher oder nachher?
                                            if(defElements[j] == createdNames[k]) {
                                                defElements[j] = macroName+"."+createdNames[k];
                                            }
                                        }
                                    }
                                    for(k=0; k<params.length; k++) {
                                        if(defElements[j] == params[k]) {
                                            defElements[j] = paraIn[k];
                                        }
                                    }
                                }
                            }
                            defElements[1] = JXG.getReference(this,RegExp.$3);
                            defElements[2] = JXG.getReference(this,RegExp.$4);
                            obj = [];
                            obj[0] = (function(el, board) { return function() {
                                                                          return (1-el[0])*el[1].coords.usrCoords[1]+el[0]*el[2].coords.usrCoords[1];
                                                           }}
                                              )(defElements, this);
                            obj[1] = (function(el, board) { return function() {
                                                                          return (1-el[0])*el[1].coords.usrCoords[2]+el[0]*el[2].coords.usrCoords[2];
                                                           }}
                                              )(defElements, this);
                            if(objName != '') {
                                attributes.name = objName;
                                if(mode == 'macro') {
                                    if(macroName != '') {
                                        attributes.id = macroName+"."+objName;
                                    }
                                    createdNames.push(objName);
                                }
                            }
                            output.points.push(this.createElement('point',[obj[0],obj[1]],attributes));
                            if(objName != '') {
                                output[objName] = output.points[output.points.length-1];
                            }
                        }
                        else if(splitted[i].search(/(\S*)\s*:\s*(.*)/) != -1) { // Funktionsgraph
                            objName = RegExp.$1;
                            tmp = JXG.GeonextParser.geonext2JS(RegExp.$2, this);
                            defElements = [new Function('x','var y = '+tmp+'; return y;')];
                            attributes.name = objName;
                            output.functions.push(this.create('functiongraph',defElements,attributes));
                            output[objName] = output.functions[output.functions.length-1];
                        }
                        else if(splitted[i].search(/#(.*)\(\s*([0-9])\s*[,|]\s*([0-9])\s*\)/) != -1) { // Text element
                            defElements = []; // [0-9\.\-]+
                            defElements[0] = RegExp.$1;
                            defElements[1] = 1.0*RegExp.$2;
                            defElements[2] = 1.0*RegExp.$3;
                            defElements[0] = defElements[0].replace (/^\s+/, '').replace (/\s+$/, ''); // trim
                            output.texts.push(this.createElement('text',[defElements[1],defElements[2],defElements[0]], attributes));
                        }
                        else if(splitted[i].search(/(\S*)\s*\[(.*)\]/) != -1) { // Polygon
                            attributes.name = RegExp.$1;
                            if(attributes.withLabel == undefined) {
                                attributes.withLabel = true;
                            }
                            defElements = RegExp.$2;
                            defElements = defElements.split(',');
                            for(j=0; j<defElements.length; j++) {
                                defElements[j] = defElements[j].replace (/^\s+/, '').replace (/\s+$/, ''); // trim
                                if(mode == 'macro') {
                                    if(macroName != '') {
                                        for(k=0; k<createdNames.length; k++) { // vorher oder nachher?
                                            if(defElements[j] == createdNames[k]) {
                                                defElements[j] = macroName+"."+createdNames[k];
                                            }
                                        }
                                    }
                                    for(k=0; k<params.length; k++) {
                                        if(defElements[j] == params[k]) {
                                            defElements[j] = paraIn[k];
                                        }
                                    }
                                }
                                defElements[j] = JXG.getReference(this,defElements[j]);
                            }
                            output.polygons.push(this.createElement('polygon',defElements,attributes));
                            output[attributes.name] = output.polygons[output.polygons.length-1];
                        }
                    }
                }
            }
        }
    }
    this.update();
    return output;
};

/**
 * Parses a string like<br />
 * <tt>&lt;macro-name&gt; = Macro(A, B, C) { <Command in JSXGraph Construction syntax>; ...<Command in JXG-Construct syntax>; }</tt><br />
 * and adds it as a macro so it can be used in the JSXGraph Construction Syntax.
 * @param {String} string A string like the one in the methods description.
 * @see #construct
 */
JXG.Board.prototype.addMacro = function(string) {
    var defHead, defBody, defName = '', i;
    string.match(/(.*)\{(.*)\}/);
    defHead = RegExp.$1;
    defBody = RegExp.$2;
    if(defHead.search(/=/) != -1) {
        defHead.match(/\s*(\S*)\s*=.*/);
        defName = RegExp.$1;
        defHead = (defHead.split('='))[1];
    }
    defHead.match(/Macro\((.*)\)/);
    defHead = RegExp.$1;
    defHead = defHead.split(',');
    for(i=0; i < defHead.length; i++) {
        defHead[i].match(/\s*(\S*)\s*/);
        defHead[i] = RegExp.$1;
    }

    if(this.definedMacros == null) {
        this.definedMacros = {};
        this.definedMacros.macros = [];
    }

    this.definedMacros.macros.push([defName, defHead, defBody]);
    if(defName != '') {
        this.definedMacros.defName = this.definedMacros.macros[this.definedMacros.macros.length-1];
    }
};

// vim: et ts=4
