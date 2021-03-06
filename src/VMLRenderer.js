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
/*
--------------------------------------------------------------------
von AbstractRenderer abgeleitete Zeichenklasse
fuer Browser mit VML-Elementen (Internet Explorer)
--------------------------------------------------------------------
*/

JXG.VMLRenderer = function(container) {
    this.constructor();
    
    this.container = container;
    this.container.style.overflow = 'hidden';
    this.container.onselectstart = function () { return false; };
    
    this.resolution = 10; // Paths are drawn with a a resolution of this.resolution/pixel.
  
    // Add VML includes and namespace
    // Original: IE <=7
    container.ownerDocument.namespaces.add("jxgvml", "urn:schemas-microsoft-com:vml");
    //container.ownerDocument.createStyleSheet().addRule("v\\:*", "behavior: url(#default#VML);");

    this.container.ownerDocument.createStyleSheet().addRule(".jxgvml", "behavior:url(#default#VML)");
    try {
        !container.ownerDocument.namespaces.jxgvml && container.ownerDocument.namespaces.add("jxgvml", "urn:schemas-microsoft-com:vml");
        this.createNode = function (tagName) {
            return container.ownerDocument.createElement('<jxgvml:' + tagName + ' class="jxgvml">');
        };
    } catch (e) {
        this.createNode = function (tagName) {
            return container.ownerDocument.createElement('<' + tagName + ' xmlns="urn:schemas-microsoft.com:vml" class="jxgvml">');
        };
    }
        
    // um Dashes zu realisieren
    this.dashArray = ['Solid', '1 1', 'ShortDash', 'Dash', 'LongDash', 'ShortDashDot', 'LongDashDot'];    
};

JXG.VMLRenderer.prototype = new JXG.AbstractRenderer;

JXG.VMLRenderer.prototype.setAttr = function(node, key, val, val2) {
    try {
        if (document.documentMode==8) {
            node[key] = val;
        } else {
            node.setAttribute(key,val,val2);
        }
    } catch (e) {
        //document.getElementById('debug').innerHTML += node.id+' '+key+' '+val+'<br>\n';
    }
};

JXG.VMLRenderer.prototype.setShadow = function(el) {
    var nodeShadow = el.rendNodeShadow;
    
    if (!nodeShadow) return;                          // Added 29.9.09. A.W.
    if (el.visPropOld['shadow']==el.visProp['shadow']) {
        return;
    }
    if(el.visProp['shadow']) {
        this.setAttr(nodeShadow, 'On', 'True');
        this.setAttr(nodeShadow, 'Offset', '3pt,3pt');
        this.setAttr(nodeShadow, 'Opacity', '60%');
        this.setAttr(nodeShadow, 'Color', '#aaaaaa');
    }
    else {
        this.setAttr(nodeShadow, 'On', 'False');
    }
    el.visPropOld['shadow']=el.visProp['shadow'];
};

JXG.VMLRenderer.prototype.setGradient = function(el) {
    var nodeFill = el.rendNodeFill;
    if(el.visProp['gradient'] == 'linear') {
        this.setAttr(nodeFill, 'type', 'gradient');
        this.setAttr(nodeFill, 'color2', el.visProp['gradientSecondColor']);
        this.setAttr(nodeFill, 'opacity2', el.visProp['gradientSecondOpacity']);
        this.setAttr(nodeFill, 'angle', el.visProp['gradientAngle']);
    }
    else if (el.visProp['gradient'] == 'radial') {
        this.setAttr(nodeFill, 'type','gradientradial');
        this.setAttr(nodeFill, 'color2',el.visProp['gradientSecondColor']);
        this.setAttr(nodeFill, 'opacity2',el.visProp['gradientSecondOpacity']);
        this.setAttr(nodeFill, 'focusposition', el.visProp['gradientPositionX']*100+'%,'+el.visProp['gradientPositionY']*100+'%');
        this.setAttr(nodeFill, 'focussize', '0,0');
    }
    else {
        this.setAttr(nodeFill, 'type','solid');
    }
};

JXG.VMLRenderer.prototype.updateGradient = function(el) {}; // Not needed in VML;

JXG.VMLRenderer.prototype.addShadowToGroup = function(groupname, board) {
    var el, pEl;
    if(groupname == "lines") {
        for(el in board.objects) {
            pEl = board.objects[el];
            if(pEl.elementClass == JXG.OBJECT_CLASS_LINE) {
                this.addShadowToElement(pEl);
            }
        }
    }
    else if(groupname == "points") {
        for(el in board.objects) {
            pEl = board.objects[el];
            if(pEl.elementClass == JXG.OBJECT_CLASS_POINT) {
                this.addShadowToElement(pEl);
            }
        }
    }
    else if(groupname == "circles") {
        for(el in board.objects) {
            pEl = board.objects[el];
            if(pEl.elementClass == JXG.OBJECT_CLASS_CIRCLE) {
                this.addShadowToElement(pEl);
            }
        }
    }    
    board.fullUpdate();
};

JXG.VMLRenderer.prototype.displayCopyright = function(str,fontsize) {
    var node, t;
    
    //node = this.container.ownerDocument.createElement('v:textbox');
    node = this.createNode('textbox');
    node.style.position = 'absolute';
    this.setAttr(node,'id', this.container.id+'_'+'licenseText');
    
    node.style.left = 20;
    node.style.top = (2);
    node.style.fontSize = (fontsize);
    node.style.color = '#356AA0';
    node.style.fontFamily = 'Arial,Helvetica,sans-serif';
    this.setAttr(node,'opacity','30%');
    node.style.filter = 'alpha(opacity = 30)';
    
    t = document.createTextNode(str);
    node.appendChild(t);
    this.appendChildPrim(node,0);
};
JXG.VMLRenderer.prototype.drawInternalText = function(el) {
    var node;
    node = this.createNode('textbox');
    node.style.position = 'absolute';
    if (document.documentMode==8) {    
        node.setAttribute('class', 'JXGtext');
    } else {
        node.setAttribute('className', 9);
    }
    el.rendNodeText = document.createTextNode('');
    node.appendChild(el.rendNodeText);
    this.appendChildPrim(node,9);
    return node;
};

JXG.VMLRenderer.prototype.updateInternalText = function(/** JXG.Text */ el) { 
    el.rendNode.style.left = (el.coords.scrCoords[1])+'px'; 
    el.rendNode.style.top = (el.coords.scrCoords[2] - this.vOffsetText)+'px'; 
    el.updateText();
    if (el.htmlStr!= el.plaintextStr) {
        el.rendNodeText.data = el.plaintextStr;
        el.htmlStr = el.plaintextStr;
    }
};

JXG.VMLRenderer.prototype.drawTicks = function(ticks) {
    var ticksNode = this.createPrim('path', ticks.id);
    this.appendChildPrim(ticksNode,ticks.layer);
    //ticks.rendNode = ticksNode;
    this.appendNodesToElement(ticks, 'path');
};

JXG.VMLRenderer.prototype.updateTicks = function(axis,dxMaj,dyMaj,dxMin,dyMin) {
    var tickArr = [], i, len, c, ticks, r = this.resolution;
    
    len = axis.ticks.length;
    for (i=0; i<len; i++) {
        c = axis.ticks[i].scrCoords;
        if(axis.ticks[i].major) {
            if (axis.labels[i].visProp['visible']) this.drawText(axis.labels[i]);        
            tickArr.push(' m ' + Math.round(r*(c[1]+dxMaj)) + 
                         ', ' + Math.round(r*(c[2]-dyMaj)) + 
                         ' l ' + Math.round(r*(c[1]-dxMaj)) + 
                         ', ' + Math.round(r*(c[2]+dyMaj))+' ');
        }
        else
            tickArr.push(' m ' + Math.round(r*(c[1]+dxMin)) + 
                         ', ' + Math.round(r*(c[2]-dyMin)) + 
                         ' l ' + Math.round(r*(c[1]-dxMin)) + 
                         ', ' + Math.round(r*(c[2]+dyMin))+' ');
    }

    ticks = this.getElementById(axis.id);
    if(ticks == null) {
        ticks = this.createPrim('path', axis.id);
        this.appendChildPrim(ticks,axis.layer);
        this.appendNodesToElement(axis,'path');
    } 
    this.setAttr(ticks,'stroked', 'true');
    this.setAttr(ticks,'strokecolor', axis.visProp['strokeColor'], 1);
    this.setAttr(ticks,'strokeweight', axis.visProp['strokeWidth']);   
    //ticks.setAttributeNS(null, 'stroke-opacity', axis.visProp['strokeOpacity']);
    this.updatePathPrim(ticks, tickArr, axis.board);
};

JXG.VMLRenderer.prototype.drawImage = function(el) {
    // IE 8: Bilder ueber data URIs werden bis 32kB unterstuetzt.
    var node, url = el.url; //'data:image/png;base64,' + el.imageBase64String;    
    
    node = this.container.ownerDocument.createElement('img');
    node.style.position = 'absolute';
    this.setAttr(node,'id', this.container.id+'_'+el.id);

    this.setAttr(node,'src',url);
    this.container.appendChild(node);
    this.appendChildPrim(node,el.layer);
    node.style.filter = "progid:DXImageTransform.Microsoft.Matrix(M11='1.0', sizingMethod='auto expand')";
    el.rendNode = node;
    this.updateImage(el);
};

JXG.VMLRenderer.prototype.transformImage = function(el,t) {
    var node = el.rendNode, 
        m;
    m = this.joinTransforms(el,t);
    node.style.left = (el.coords.scrCoords[1] + m[1][0]) + 'px'; 
    node.style.top = (el.coords.scrCoords[2]-el.size[1] + m[2][0]) + 'px';    
    node.filters.item(0).M11 = m[1][1];
    node.filters.item(0).M12 = m[1][2];
    node.filters.item(0).M21 = m[2][1];
    node.filters.item(0).M22 = m[2][2];
};

JXG.VMLRenderer.prototype.joinTransforms = function(el,t) {
    var m = [[1,0,0],[0,1,0],[0,0,1]], 
        i,
        len = t.length;
        
    for (i=0;i<len;i++) {
        m = JXG.Math.matMatMult(t[i].matrix,m);
    }
    return m;
};

JXG.VMLRenderer.prototype.transformImageParent = function(el,m) {};

/*
JXG.VMLRenderer.prototype.removeGrid = function(board) { 
    var c = this.getElementById('gridx');
    this.remove(c);

    c = this.getElementById('gridy');
    this.remove(c);

    board.hasGrid = false;
};
*/

JXG.VMLRenderer.prototype.hide = function(el) {
    el.rendNode.style.visibility = "hidden"; 
};

JXG.VMLRenderer.prototype.show = function(el) {
    el.rendNode.style.visibility = "inherit";  
};

JXG.VMLRenderer.prototype.setDashStyle = function(el,visProp) {
    var node;
    if(visProp['dash'] >= 0) {
        node = el.rendNodeStroke;
        this.setAttr(node,'dashstyle', this.dashArray[visProp['dash']]);
    }
};
 
JXG.VMLRenderer.prototype.setObjectStrokeColor = function(el, color, opacity) {
    var c = this.eval(color), 
        o = this.eval(opacity), 
        node, nodeStroke;

    o = (o>0)?o:0;

    if (el.visPropOld['strokeColor']==c && el.visPropOld['strokeOpacity']==o) {
        return;
    }
    if(el.type == JXG.OBJECT_TYPE_TEXT) {
        el.rendNode.style.color = c;
    }        
    else {       
        node = el.rendNode;
        this.setAttr(node,'stroked', 'true');
        this.setAttr(node,'strokecolor', c);
        
        if(el.id == 'gridx') {
            nodeStroke = this.getElementById('gridx_stroke');
        }
        else if(el.id == 'gridy') {
            nodeStroke = this.getElementById('gridy_stroke');
        }
        else {
            nodeStroke = el.rendNodeStroke;
        }
        if (o!=undefined) {
            this.setAttr(nodeStroke,'opacity', (o*100)+'%');  
            
        }
    }
    el.visPropOld['strokeColor'] = c;
    el.visPropOld['strokeOpacity'] = o;
};

JXG.VMLRenderer.prototype.setObjectFillColor = function(el, color, opacity) {
    var c = this.eval(color), 
        o = this.eval(opacity);

    o = (o>0)?o:0;

    if (el.visPropOld['fillColor']==c && el.visPropOld['fillOpacity']==o) {
        return;
    }
    if(c == 'none') {
        this.setAttr(el.rendNode,'filled', 'false');
    }
    else {
        this.setAttr(el.rendNode,'filled', 'true');
        this.setAttr(el.rendNode,'fillcolor', c); 
        if (o!=undefined && el.rendNodeFill) {  // Added el.rendNodeFill 29.9.09  A.W.
            this.setAttr(el.rendNodeFill,'opacity', (o*100)+'%');
        }
    }
    el.visPropOld['fillColor'] = c;
    el.visPropOld['fillOpacity'] = o;
};

JXG.VMLRenderer.prototype.remove = function(node) {
  if (node!=null) node.removeNode(true);
};

JXG.VMLRenderer.prototype.suspendRedraw = function() {
    this.container.style.display='none';
};

JXG.VMLRenderer.prototype.unsuspendRedraw = function() {
    this.container.style.display='';
};

JXG.VMLRenderer.prototype.setAttributes = function(node,props,vmlprops,visProp) {
    var val, i, p
        len = props.length;

    for (i=0;i<len;i++) {
        p = props[i];
        if (visProp[p]!=null) {
            val = this.eval(visProp[p]);
            val = (val>0)?val:0;
            this.setAttr(node,vmlprops[i], val);
        }
    }
};

JXG.VMLRenderer.prototype.setGridDash = function(id, node) {
    var node = this.getElementById(id+'_stroke');
    this.setAttr(node,'dashstyle', 'Dash');
};

/**
 * Sets an elements stroke width.
 * @param {Object} el Reference to the geometry element.
 * @param {int} width The new stroke width to be assigned to the element.
 */
JXG.VMLRenderer.prototype.setObjectStrokeWidth = function(el, width) {
    var w = this.eval(width), 
        node;
    //w = (w>0)?w:0;
    
    if (el.visPropOld['strokeWidth']==w) {
        return;
    }
    
    node = el.rendNode;
    this.setPropertyPrim(node,'stroked', 'true');
    if (w!=null) { 
        this.setPropertyPrim(node,'stroke-width',w); 
    }
    el.visPropOld['strokeWidth'] = w;
};

JXG.VMLRenderer.prototype.createPrim = function(type, id) {
    var node, 
        fillNode = this.createNode('fill'), 
        strokeNode = this.createNode('stroke'), 
        shadowNode = this.createNode('shadow'), 
        pathNode;
    
    this.setAttr(fillNode, 'id', this.container.id+'_'+id+'_fill');
    this.setAttr(strokeNode, 'id', this.container.id+'_'+id+'_stroke');
    this.setAttr(shadowNode, 'id', this.container.id+'_'+id+'_shadow');
    
    if (type=='circle' || type=='ellipse' ) {
        node = this.createNode('oval');
        node.appendChild(fillNode);
        node.appendChild(strokeNode);
        node.appendChild(shadowNode);
    } else if (type == 'polygon' || type == 'path' || type == 'shape' || type == 'line') {    
        node = this.createNode('shape');
        node.appendChild(fillNode);
        node.appendChild(strokeNode);
        node.appendChild(shadowNode);   
        pathNode = this.createNode('path');
        this.setAttr(pathNode, 'id', this.container.id+'_'+id+'_path');        
        node.appendChild(pathNode);
    } else {
        node = this.createNode(type);
        node.appendChild(fillNode);
        node.appendChild(strokeNode);
        node.appendChild(shadowNode);
    }
    node.style.position = 'absolute';
    this.setAttr(node, 'id', this.container.id+'_'+id);
    
    return node;
};

JXG.VMLRenderer.prototype.appendNodesToElement = function(element, type) {
    if(type == 'shape' || type == 'path' || type == 'polygon') {
        element.rendNodePath = this.getElementById(element.id+'_path');
    }
    element.rendNodeFill = this.getElementById(element.id+'_fill');
    element.rendNodeStroke = this.getElementById(element.id+'_stroke');
    element.rendNodeShadow = this.getElementById(element.id+'_shadow');
    element.rendNode = this.getElementById(element.id);
};

JXG.VMLRenderer.prototype.makeArrow = function(node,el,idAppendix) {
    var nodeStroke = el.rendNodeStroke;
    this.setAttr(nodeStroke, 'endarrow', 'block');
    this.setAttr(nodeStroke, 'endarrowlength', 'long');
};

JXG.VMLRenderer.prototype.makeArrows = function(el) {
    var nodeStroke;
    
    if (el.visPropOld['firstArrow']==el.visProp['firstArrow'] && el.visPropOld['lastArrow']==el.visProp['lastArrow']) {
        return;
    }

    if(el.visProp['firstArrow']) {
        nodeStroke = el.rendNodeStroke;
        this.setAttr(nodeStroke, 'startarrow', 'block');
        this.setAttr(nodeStroke, 'startarrowlength', 'long');                 
    }
    else {
        nodeStroke = el.rendNodeStroke;
        if(nodeStroke != null) {
            this.setAttr(nodeStroke, 'startarrow', 'none');
        }            
    }
    if(el.visProp['lastArrow']) {
        nodeStroke = el.rendNodeStroke;
        this.setAttr(nodeStroke, 'id', this.container.id+'_'+el.id+"stroke");
        this.setAttr(nodeStroke, 'endarrow', 'block');
        this.setAttr(nodeStroke, 'endarrowlength', 'long');            
    }
    else {
        nodeStroke = el.rendNodeStroke;
        if(nodeStroke != null) {
            this.setAttr(nodeStroke, 'endarrow', 'none');
        }        
    }    
    el.visPropOld['firstArrow'] = el.visProp['firstArrow'];
    el.visPropOld['lastArrow'] = el.visProp['lastArrow'];
};

JXG.VMLRenderer.prototype.updateLinePrim = function(node,p1x,p1y,p2x,p2y,board) {
    /* 
    this.setAttr(node, 'from', [p1x,p1y].join(',')); 
    this.setAttr(node, 'to', [p2x,p2y].join(','));      
    */
    var s, r = this.resolution;
    s = ['m ',r*p1x,', ',r*p1y,' l ',r*p2x,', ',r*p2y];
    this.updatePathPrim(node,s,board);
};

JXG.VMLRenderer.prototype.updateCirclePrim = function(node,x,y,r) {
    //node.setAttribute('style','left:'+(x-r)+'px; top:'+(y-r)+'px; width:'+(r*2)+'px; height:'+ (r*2)+'px'); 
    node.style.left = (x-r)+'px';
    node.style.top = (y-r)+'px';    
    node.style.width = (r*2)+'px'; 
    node.style.height = (r*2)+'px';   
};

JXG.VMLRenderer.prototype.updateRectPrim = function(node,x,y,w,h) {
    node.style.left = (x)+'px';
    node.style.top = (y)+'px';    
    node.style.width = (w)+'px'; 
    node.style.height = (h)+'px';   
};

JXG.VMLRenderer.prototype.updateEllipsePrim = function(node,x,y,rx,ry) {
    node.style.left = (x-rx)+'px';
    node.style.top =  (y-ry)+'px'; 
    node.style.width = (rx*2)+'px'; 
    node.style.height = (ry*2)+'px';
};

JXG.VMLRenderer.prototype.updatePathPrim = function(node,pointString,board) {
    var x = board.canvasWidth, 
        y = board.canvasHeight;
    node.style.width = x;
    node.style.height = y;
    this.setAttr(node, 'coordsize', [(this.resolution*x),(this.resolution*y)].join(','));
    this.setAttr(node, 'path',pointString.join(""));
};

JXG.VMLRenderer.prototype.updatePathStringPrim = function(el) {
    var pStr = [], 
        //h = 3*el.board.canvasHeight, 
        //w = 100*el.board.canvasWidth, 
        i, scr,
        r = this.resolution,
        mround = Math.round,
        symbm = ' m ', 
        symbl = ' l ',
        nextSymb = symbm, 
        isNoPlot = (el.curveType!='plot'),
        //isFunctionGraph = (el.curveType=='functiongraph'),
        len = Math.min(el.numberPoints,8192); // otherwise IE 7 crashes in hilbert.html
    
    if (el.numberPoints<=0) { return ''; }
    if (isNoPlot && el.board.options.curve.RDPsmoothing) {
        el.points = this.RamenDouglasPeuker(el.points,1.0);
    }
    len = Math.min(len,el.points.length);

    for (i=0; i<len; i++) {
        scr = el.points[i].scrCoords;
        if (isNaN(scr[1]) || isNaN(scr[2]) /* || Math.abs(scr[1])>w || (isFunctionGraph && (scr[2]>h || scr[2]<-0.5*h))*/ ) {  // PenUp
            nextSymb = symbm;
        } else {
            // IE has problems with values  being too far away.
            if (scr[1]>20000.0) { scr[1] = 20000.0; }
            else if (scr[1]<-20000.0) { scr[1] = -20000.0; }
            if (scr[2]>20000.0) { scr[2] = 20000.0; }
            else if (scr[2]<-20000.0) { scr[2] = -20000.0; }

            pStr.push([nextSymb,mround(r*scr[1]),', ',mround(r*scr[2])].join(''));
            nextSymb = symbl;
        }
    }
    pStr.push(' e');
    return pStr;
};

JXG.VMLRenderer.prototype.updatePathStringPoint = function(el, size, type) {
    var s = [],
        scr = el.coords.scrCoords,
        sqrt32 = size*Math.sqrt(3)*0.5,
        s05 = size*0.5,
        r = this.resolution;

    if(type == 'x') {
        s.push(['m ',(r*(scr[1]-size)),', ',(r*(scr[2]-size)),' l ',
        (r*(scr[1]+size)),', ',(r*(scr[2]+size)),' m ',
        (r*(scr[1]+size)),', ',(r*(scr[2]-size)),' l ',
        (r*(scr[1]-size)),', ',(r*(scr[2]+size))].join(''));
    }
    else if(type == '+') {
        s.push(['m ',(r*(scr[1]-size)),', ',(r*(scr[2])),' l ',
        (r*(scr[1]+size)),', ',(r*(scr[2])),' m ',
        (r*(scr[1])),', ',(r*(scr[2]-size)),' l ',
        (r*(scr[1])),', ',(r*(scr[2]+size))].join(''));    
    }
    else if(type == 'diamond') {
        s.push(['m ',(r*(scr[1]-size)),', ',(r*(scr[2])),' l ',
        (r*(scr[1])),', ',(r*(scr[2]+size)),' l ',
        (r*(scr[1]+size)),', ',(r*(scr[2])),' l ',
        (r*(scr[1])),', ',(r*(scr[2]-size)),' x e '
        ].join(''));   
    }
    else if(type == 'A') {
        s.push(['m ',(r*(scr[1])),', ',(r*(scr[2]-size)),' l ',
        Math.round(r*(scr[1]-sqrt32)),', ',(r*(scr[2]+s05)),' l ',
        Math.round(r*(scr[1]+sqrt32)),', ',(r*(scr[2]+s05)),' x e '
        ].join(''));           
    } 
    else if(type == 'v') {
        s.push(['m ',(r*(scr[1])),', ',(r*(scr[2]+size)),' l ',
        Math.round(r*(scr[1]-sqrt32)),', ',(r*(scr[2]-s05)),' l ',
        Math.round(r*(scr[1]+sqrt32)),', ',(r*(scr[2]-s05)),' x e '
        ].join(''));       
    }   
    else if(type == '>') {
        s.push(['m ',(r*(scr[1]+size)),', ',(r*(scr[2])),' l ',
        (r*(scr[1]-s05)),', ',Math.round(r*(scr[2]-sqrt32)),' l ',
        (r*(scr[1]-s05)),', ',Math.round(r*(scr[2]+sqrt32)),
        //' x e '
        ' l ',(r*(scr[1]+size)),', ',(r*(scr[2])) 
        ].join(''));        
    }
    else if(type == '<') {
        s.push(['m ',(r*(scr[1]-size)),', ',(r*(scr[2])),' l ',
        (r*(scr[1]+s05)),', ',Math.round(r*(scr[2]-sqrt32)),' l ',
        (r*(scr[1]+s05)),', ',Math.round(r*(scr[2]+sqrt32)),' x e '
        ].join(''));    
    }    
    return s;
}

JXG.VMLRenderer.prototype.updatePolygonePrim = function(node,el) {
    var minX = el.vertices[0].coords.scrCoords[1],
        maxX = el.vertices[0].coords.scrCoords[1],
        minY = el.vertices[0].coords.scrCoords[2],
        maxY = el.vertices[0].coords.scrCoords[2],
        i, 
        len = el.vertices.length,
        scr, x, y, 
        pStr = [];
        
    this.setAttr(node, 'stroked', 'false');
    for(i=1; i<len-1; i++) {
        scr = el.vertices[i].coords.scrCoords;
        if(scr[1] < minX) {
            minX = scr[1];
        }
        else if(scr[1] > maxX) {
            maxX = scr[1];
        }
        if(scr[2] < minY) {
            minY = scr[2];
        }
        else if(scr[2] > maxY) {
            maxY = scr[2];
        }
    }

    x = Math.round(maxX-minX); // Breite des umgebenden Rechtecks?
    y = Math.round(maxY-minY); // Hoehe des umgebenden Rechtecks?

    if (!isNaN(x) && !isNaN(y)) {
        node.style.width = x;
        node.style.height = y;
        this.setAttr(node, 'coordsize', x+','+y);
    }
     
    scr = el.vertices[0].coords.scrCoords;
    pStr.push(["m ",scr[1],",",scr[2]," l "].join(''));
    
    for(i=1; i<len-1; i++) {
        scr = el.vertices[i].coords.scrCoords;
        pStr.push(scr[1] + "," + scr[2]);
        if(i<len-2) {
            pStr.push(", ");
        }
    }
    pStr.push(" x e");

    this.setAttr(node, 'path',pStr.join(""));
};

JXG.VMLRenderer.prototype.appendChildPrim = function(node,level) {
    if (typeof level=='undefined') level = 0;   // For trace nodes    
    node.style.zIndex = level;
    /*
    switch (level) {
        case 'images': node.style.zIndex = "1"; break;
        case 'grid': node.style.zIndex = "1"; break;
        case 'angles': node.style.zIndex = "2"; break;
        case 'sectors': node.style.zIndex = "2"; break;
        case 'polygone': node.style.zIndex = "2"; break;
        case 'curves': node.style.zIndex = "4"; break; //2
        case 'circles': node.style.zIndex = "4"; break; //3
        case 'lines': node.style.zIndex = "4"; break;
        case 'arcs': node.style.zIndex = "4"; break;
        case 'points': node.style.zIndex = "5"; break;
    }
    */
    this.container.appendChild(node);
};

JXG.VMLRenderer.prototype.setPropertyPrim = function(node,key,val) {
    var keyVml = '', 
        node2, v;
        
    switch (key) {
        case 'stroke': keyVml = 'strokecolor'; break;
        case 'stroke-width': keyVml = 'strokeweight'; break;
        case 'stroke-dasharray': keyVml = 'dashstyle'; break;
    }
    if (keyVml!='') {
        v = this.eval(val);
        this.setAttr(node, keyVml, v);
    }
};

JXG.VMLRenderer.prototype.drawVerticalGrid = function(topLeft, bottomRight, gx, board) {
    var node = this.createPrim('path', 'gridx'),
        gridArr = [];
        
    while(topLeft.scrCoords[1] < bottomRight.scrCoords[1] + gx - 1) { 
        gridArr.push(' m ' + (this.resolution*topLeft.scrCoords[1]) + 
                     ', ' + 0 + 
                     ' l ' + (this.resolution*topLeft.scrCoords[1]) + 
                     ', ' + (this.resolution*board.canvasHeight)+' ');
        topLeft.setCoordinates(JXG.COORDS_BY_SCREEN, [topLeft.scrCoords[1] + gx, topLeft.scrCoords[2]]);   
    }
    this.updatePathPrim(node, gridArr, board);
    return node;
};

JXG.VMLRenderer.prototype.drawHorizontalGrid = function(topLeft, bottomRight, gy, board) {
    var node = this.createPrim('path', 'gridy'),
        gridArr = [];
    while(topLeft.scrCoords[2] <= bottomRight.scrCoords[2] + gy - 1) {
        gridArr.push(' m ' + 0 + 
                     ', ' + (this.resolution*topLeft.scrCoords[2]) + 
                     ' l ' + (this.resolution*board.canvasWidth) + 
                     ', ' + (this.resolution*topLeft.scrCoords[2])+' ');
        topLeft.setCoordinates(JXG.COORDS_BY_SCREEN, [topLeft.scrCoords[1], topLeft.scrCoords[2] + gy]);
    }
    this.updatePathPrim(node, gridArr, board);
    return node;
};
