/*
    webgl-physics-cyclone
    
    (c) 2014, 2015 Edward Gerhold
    
    Contains definitions from book authors.
    And as well my own code to make use of their.
    
    This is the initial file of the project.
    Expect it to change at some unknown point.
    
    It contains
    - Everyone has his own WebGL code: 
      A begun matrix library for webgl with glmatrix function argument syntax.
      May have mistakes and is not complete. I am failing in terms of completeness of
      the graphic mathematics, i still fail writing my own projection for 2d canvas to show e.g. 3d surfaces on screen
    - Useful: some stuff from "Core HTML5 Canvas" like AnimationTimer
    - The Hit: The Cyclone Physics Engine from Ian Millingtons Book "Game Physics Engine Development"
    
    After checking what�s going on, dynamics is no longer a black box for me,
    nor the collision detection.
    
    Has to be debugged.
    
    Problem: My laptop is out of order, have no webgl since november.

*/


function sinh(y) {
    return 0.5*(Math.pow(Math.E, y) - Math.pow(Math.E, -y));
}
function cosh(x) {
   return 0.5*(Math.pow(Math.E, x) + Math.pow(Math.E, -x));
}

if (typeof Math.sinh === "undefined") {
	Math.sinh = sinh;
}
if (typeof Math.cosh === "undefined") {
	Math.cosh = cosh;
}

if (typeof Math.cot === "undefined") {
    Math.cot = function (x) {
        return 1 / Math.tan(x);
    };
}
if (typeof Math.csc == "undefined") {
    Math.csc = function (x) {
        return 1 / Math.sin(x);
    };
}
if (typeof Math.sec === "undefined") {
    Math.sec = function (x) {
        return 1 / Math.cos(x);
    };
}
if (typeof Math.rad === "undefined") {
    Math.rad = function (deg) {
        return (Math.PI / 180) * deg;
    };
}
if (typeof Math.deg === "undefined") {
    Math.deg = function (rad) {
        return rad / (Math.PI / 180);
    };
}

min = {
    toString: function () {
        return "[object Minimum.*]";
    }
};
min.GL = {
    toString: function () {
        return "[object MinimumWebGL]";
    }
};
min.AU = {
    toString: function () {
        return "[object MinimumWebAudio]";
    }
};
min.PH = {
    toString: function () {
        return "[object MinimumGamePhysics]";
    }
};
min.MA = {
    toString: function () {
        return "[object MinimumMath]";
    }
};
min.DOM = {
    toString: function () {
        return "[object MinimumDOM]";
    }
};

/**

 Painter

 **/
/* ************************************************************************************************************************************************************************************************* */
var MeshPainters = {
    indexed: {
        paint: function (sprite, gl, program) {
            "use strict";
            gl.bindBuffer(gl.ARRAY_BUFFER, sprite.vbo);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sprite.ibo);
            gl.drawElements(gl.TRIANGLES, sprite.ibo.length, 1, gl.UNSIGNED_SHORT, false, 0, 0)
        }
    }
};


function AnimationTimer(duration, timewarp) {
    this.timewarp = timewarp;
    this.duration = duration;
    this.stopwatch = new Stopwatch();
}

AnimationTimer.makeEaseIn = function (strength) {
    return function (percentComplete) {
        return Math.pow(percentComplete, strength * 2);
    };
};
AnimationTimer.makeEaseOut = function (strength) {
    return function (percentComplete) {
        return Math.pow(1 - percentComplete, strength * 2);
    };
};

AnimationTimer.makeEaseInOut = function () {
    return function (percentComplete) {
        return percentComplete - Math.sin(percentComplete * 2 * Math.PI);
    };
};

AnimationTimer.DEFAULT_ELASTIC_PASSES = 5;
AnimationTimer.makeElastic = function (passes) {
    pass = passes || AnimationTimer.DEFAULT_ELASTIC_PASSES;
    return function (percentComplete) {
        return ((1 - Math.cos(percentComplete - 2 * Math.PI * passes)) * (1 - percentComplete)) + percentComplete;
    };
};

AnimationTimer.makeBounce = function (bounces) {
    var fn = AnimationTimer.makeElastic(bounces);
    return function (percentComplete) {
        percentComplete = fn(percentComplete);
        return percentComplete <= 1 ? percentComplete : 2 - percentComplete;
    };
};

AnimationTimer.makeLinear = function () {
    return function (percentComplete) {
        return percentComplete;
    };
};
AnimationTimer.prototype = {

    start: function () {
        this.stopwatch.start();
    },

    stop: function () {
        this.stopwatch.stop();
    },

    getElapsedTime: function () {
        var elapsedTime = this.stopwatch.getElapsedTime(),
            percentComplete = elapsedTime / this.duration;
        if (this.stopwatch.running) return undefined;
        if (this.timewarp == undefined) return elapsedTime;
        return elapsedTime * (this.timewarp(percentComplete) / percentComplete);
    },

    isRunning: function () {
        return this.stopwatch.isRunning();
    },

    isOver: function () {
        return this.stopwatch.getElapsedTime() > this.duration;
    }

};

function Stopwatch() {
    this.startTime = 0;
    this.running = false;
    this.elapsedTime = undefined;
}
Stopwatch.prototype = {
    start: function () {
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.running = true;
    },
    stop: function () {
        this.elapsedTime = Date.now() - this.startTime;
        this.running = false;
    },
    getElapsedTime: function () {
        if (this.running) {
            return Date.now() - this.startTime;
        } else {
            return this.elapsedTime;
        }
    },
    isRunning: function () {
        return this.running;
    },
    reset: function () {
        this.elapsedTime = 0;
    }
};

if (typeof Object.clone === "undefined") {
    if (typeof Object.setPrototypeOf === "undefined") {
        Object.setPrototypeOf = function (obj, prototype) {
            obj.__proto__ = prototype;
            return Object.getPrototypeOf(obj) === prototype;
        };
    }
    Object.clone = function (obj) {
        var newObj = {};
        Object.setPrototypeOf(newObj, Object.getPrototypeOf(obj));
        Object.getOwnPropertyNames(obj).forEach(function (key) {
            Object.defineProperty(this, key, Object.getOwnPropertyDescriptor(obj, key));
        }, newObj);
        return newObj;
    };
}


var ARRAY_TYPE = Float32Array;

var Floor = {
    alias: 'floor',
    wireframe: true,
    dim: 50,
    lines: 50,
    vertices: [],
    indices: [],
    diffuse: [0.7, 0.7, 0.7, 1.0],
    draw: function (gl, program) {
        drawGenericMesh(gl, program, this);
    },
    build: function (d, e) {
        if (d) Floor.dim = d;
        if (e) Floor.lines = 2 * Floor.dim / e;
        var inc = 2 * Floor.dim / Floor.lines;
        var v = [];
        var i = [];

        for (var l = 0; l <= Floor.lines; l++) {
            v[6 * l] = -Floor.dim;
            v[6 * l + 1] = 0;
            v[6 * l + 2] = -Floor.dim + (l * inc);

            v[6 * l + 3] = Floor.dim;
            v[6 * l + 4] = 0;
            v[6 * l + 5] = -Floor.dim + (l * inc);

            v[6 * (Floor.lines + 1) + 6 * l] = -Floor.dim + (l * inc);
            v[6 * (Floor.lines + 1) + 6 * l + 1] = 0;
            v[6 * (Floor.lines + 1) + 6 * l + 2] = -Floor.dim;

            v[6 * (Floor.lines + 1) + 6 * l + 3] = -Floor.dim + (l * inc);
            v[6 * (Floor.lines + 1) + 6 * l + 4] = 0;
            v[6 * (Floor.lines + 1) + 6 * l + 5] = Floor.dim;

            i[2 * l] = 2 * l;
            i[2 * l + 1] = 2 * l + 1;
            i[2 * (Floor.lines + 1) + 2 * l] = 2 * (Floor.lines + 1) + 2 * l;
            i[2 * (Floor.lines + 1) + 2 * l + 1] = 2 * (Floor.lines + 1) + 2 * l + 1;
        }
        Floor.vertices = v;
        Floor.indices = i;
    }
}




/*
 * Vec2
 */

function Vec2() {
    return Vec2.create.apply(Vec2, arguments);
}
Vec2.create = function (x,y) {
    var v = new Float32Array(2);
    v[0] = x;
    v[1] = y;
    return v;
};
Vec2.distance = function (v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
};
Vec2.normalize = function (out, v) {
    var len = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    out[0] = v[0] / len;
    out[1] = v[1] / len;
};
Vec2.dot = function (v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1];
};
Vec2.clone = function (vec) {
    return Vec2.create(vec[0], vec[1]);
};
Vec2.toVec3 = function (vec) {
    return Vec3.create(vec[0], vec[1], 1);
};
Vec2.toVec4 = function (vec) {
    return Vec4.create(vec[0], vec[1], 1, 1);
};

Vec2.rotate = function (v, theta) {
    var x = v[0], y = v[1];
    v[0] = x * Math.cos(theta) - y * Math.sin(theta);
    v[1] = x * Math.sin(theta) + y * Math.cos(theta);
    return v;
};

Vec2.rotateNew = function (v, theta) {
    var x = v[0], y = v[1];
    return Vec2.create( 
	x * Math.cos(theta) - y * Math.sin(theta), 
	x * Math.sin(theta) + y * Math.cos(theta)
    );
};

/*
 * Vec3
 */

function Vec3(x, y, z) {
    return Vec3.create(x, y, z);
}
Vec3.toVec4 = function (v, wCoordOpt) {
    if (wCoordOpt == undefined) wCoordOpt = 1;
    return Vec4.create(v[0], v[1], v[2], wCoordOpt);
};
Vec3.toQuaternion = function (v) {
    return Quaternion.create(0, v[0], v[1], v[2]);
};

Vec3.random = function (fact) {
    fact = fact || 0;
    return Vec3.create(
        Math.random() * fact,
        Math.random() * fact,
        Math.random() * fact
    );
};

Vec3.stringify = function (v) {
    return "<x:" + v[0] + ",y:" + v[1] + ",z:" + v[2] + ">";
}

Vec3.create = function (x, y, z) {
    "use strict";
    var v = new Float32Array(3);
    if (arguments.length == 1) {
        y = x[1], z = x[2], x = x[0];
    }
    v[0] = x;
    v[1] = y;
    v[2] = z;
    return v;
};

Vec3.clear = function (v) {
    v[0] = v[1] = v[2] = 0;
};

Vec3.isZero = function (v) {
    "use strict";
    return v[0] === 0 && v[1] === 0 && v[2] === 0;
};

Vec3.equals = function (v1, v2) {
    return v1[0] === v2[0] && v1[1] === v2[1] && v1[2] === v2[2];
};

Vec3.length = function (vec) {
    "use strict";
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
};

Vec3.normalize = function (out, vec) {
    "use strict";
    if (vec == undefined) {
        vec = out;
    }
    var len = Vec3.length(vec);
    out[0] = vec[0] / len;
    out[1] = vec[1] / len;
    out[2] = vec[2] / len;
};

Vec3.add = function (result, v1, v2) {
    "use strict";
    if (v2 == undefined) {
        // convenient
        v2 = v1;
        v1 = result;
    }
    result[0] = v1[0] + v2[0];
    result[1] = v1[1] + v2[1];
    result[2] = v1[2] + v2[2];
    return result;
};

Vec3.sub = function (result, v1, v2) {
    "use strict";
    if (v2 == undefined) {
        // convenient
        v2 = v1;
        v1 = result;
    }
    result[0] = v1[0] - v2[0];
    result[1] = v1[1] - v2[1];
    result[2] = v1[2] - v2[2];
    return result;
};

Vec3.dot = function (v1, v2) {
    "use strict";
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
};
Vec3.cross = function (a, b) {
    "use strict";
    return Vec3.create(
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    );

};
Vec3.squareMagnitude = function (v) {
    return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
};
Vec3.scale = function (v, s) {
    return Vec3.create(v[0] * s, v[1] * s, v[2] * s);
};
Vec3.clone = function (vec) {
    return Vec3.create(vec[0], vec[1], vec[2]);
};
Vec3.distanceVector = function (p1, p2) {
    "use strict";
    return Vec3.sub(p1, p2);
}
Vec3.distance = function (p1, p2) {
    "use strict";
    return Vec3.length(Vec3.sub(p1, p2));
};
Vec3.flipNew = function (vec) {
    "use strict";
    return Vec3.create(-vec[0], -vec[1], -vec[2]);
};

Vec3.flip = function (out, vec) {
    out[0] = -vec[0];
    out[1] = -vec[1];
    out[2] = -vec[2];
};
Vec3.set = function (out, v) {
    out[0] = v[0];
    out[1] = v[1];
    out[2] = v[2];
};
Vec3.multiplyWithScalar = function (out, vec, scalar) {
    out[0] = vec[0] * scalar;
    out[1] = vec[1] * scalar;
    out[2] = vec[2] * scalar;
};
Vec3.addScaledVector = function (out, vec, scalar) {
    out[0] += vec[0] * scalar;
    out[1] += vec[1] * scalar;
    out[2] += vec[2] * scalar;
};
Vec3.addScalar = function (out, vec, scalar) {
    out[0] = vec[0] + scalar;
    out[1] = vec[1] + scalar;
    out[2] = vec[2] + scalar;
    return out;
};
Vec3.toVec2 = function (v) {
    return Vec2.create(
        v[0] / v[2],
        v[1] / v[2]
    );
}


function v3mag(v3) {
    "use strict";
    return Math.sqrt(v3[0] * v3[0] + v3[1] * v3[1] + v3[2] * v3[2]);
}

function v3scale(v3, fac) {
    "use strict";
    v3[0] *= fac;
    v3[1] *= fac;
    v3[2] *= fac;
    return v3;
}

function v3addscaled(v3, v3b, fac) {
    "use strict";
    v3[0] += v3b[0] * fac;
    v3[0] += v3b[1] * fac;
    v3[0] += v3b[2] * fac;
    return v3;
}

function v3add(v3, sum) {
    "use strict";
    v3[0] += sum;
    v3[1] += sum;
    v3[2] += sum;
    return v3;
}
function v3subv(v3, sub3) {
    "use strict";
    v3[0] -= sub3[0];
    v3[1] -= sub3[1];
    v3[2] -= sub3[2];
    return v3;
}
function v3mulv(v3, sub3) {
    "use strict";
    v3[0] *= sub3[0];
    v3[1] *= sub3[1];
    v3[2] *= sub3[2];
    return v3;
}
function v3divv(v3, sub3) {
    "use strict";
    v3[0] /= sub3[0];
    v3[1] /= sub3[1];
    v3[2] /= sub3[2];
    return v3;
}

function v3addv(v3, sum3) {
    "use strict";
    v3[0] += sum3[0];
    v3[1] += sum3[1];
    v3[2] += sum3[2];
    return v3;
}
function v3norm(v3) {
    "use strict";
    var mag = v3mag(v3);
    v3[0] = v3[0] / mag;
    v3[1] = v3[1] / mag;
    v3[2] = v3[2] / mag;
    return v3;
}

function v3set(v3, v3b) {
    "use strict";
    v3[0] = v3b[0];
    v3[1] = v3b[1];
    v3[2] = v3b[2];
    return v3;
}


/*
 *
 * Vec4
 *
 */


function Vec4(x, y, z, w) {
    return Vec4.create.apply(Vec4, arguments);
}
Vec4.create = function (x, y, z, w) {
    var v = new Float32Array(4);
    v[0] = x;
    v[1] = y;
    v[2] = z;
    v[3] = w;
};
Vec4.toVec3 = function (v) {
    return Vec3.create(
        v[0] / v[3],
        v[1] / v[3],
        v[2] / v[3]
    );
};

Vec4.length =
    Vec4.distance = function (v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2] + v[3] * v[3]);
    };
Vec4.squareMagnitude = function (v) {
    return v[0] * v[0] + v[1] * v[1] + v[2] * v[2] + v[3] * v[3]
};
Vec4.normalize = function (out, v) {
    var len = Vec4.length(v);
    out[0] = v[0] / len;
    out[1] = v[1] / len;
    out[2] = v[2] / len;
    out[3] = v[3] / len;
};
Vec4.clone = function (vec) {
    return Vec4.create(v[0], v[1], v[2], v[3]);
};




/****
    One generic matrix for linear algebra,
    there are 2x2, 3x3, 3x4, 4x4 prepared for graphics

****/

function Mat() {
    return Mat.create.apply(Mat, arguments);
}

Mat.createMxN = function (rows, colums) {
    var fields = rows * columns;
    var mat = new ARRAY_TYPE(fields);
    return mat;
};

Mat.create = function (fields) {
    return new ARRAY_TYPE(fields);
};


/*
    Mat41 can hold [a b c d], or a plane
    
    It is a one row matrix
*/
function Mat14() {
    return Mat14.create.apply(Mat14, arguments);
}
Mat14.create = function (a, b, c, d) {
    var mat14 = new ARRAY_TYPE(4);
    var i = arguments.length;
    while (i-- > 0) {
        mat14[i] = arguments[i];
    }
    return mat14;
};
Mat14.multiply = function (m, v) {
    /* 		 [x
	[a b c d] y
		  z
		  1]
	ax+by+cz+d 
	
	Vec3 is ok.
    */
    return m[0]*v[0] + m[1]*v[1] + m[2]*v[2] + 1*m[3];
}


/*
 * Matrix 4y4
 */


function Mat4() {
    return Mat4.create.apply(Mat4, arguments);
}
Mat4.create = function (a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    var mat4 = new ARRAY_TYPE(16);
    var i = arguments.length;
    while (i-- > 0) {
        mat4[i] = arguments[i];
    }
    return mat4;
};
Mat4.getRowVector = function (rowIndex) {
    "use strict";
    return Vec4.create(v[0 + rowIndex * 4], v[3 + rowIndex * 4], v[6 + rowIndex * 4], v[9 + rowIndex * 4]);
};
Mat4.getAxisVector = function (axisIndex) {
    "use strict";
    return Vec4.create(v[0 + axisIndex * 4], v[1 + axisIndex * 4], v[2 + axisIndex * 4], v[3 + axisIndex] * 4);
}


Mat4.random = function (range) {
    range = range || 1;
    var mat4 = new ARRAY_TYPE(16);
    var i = 0;
    while (i < 16) {
        mat4[i++] = Math.random() * range;
    }
    return mat4;
};

Mat4.rotationMatrix = function (angle, inDegrees) {
    
    if (inDegrees) angle = 180/Math.PI * angle;
    
    return Mat4.create(
	Math.cos(angle), Math.sin(angle), 0.0, 0.0,
	-Math.sin(angle), Math.cos(angle), 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	0.0, 0, 0, 1.0
    );

};

Mat4.det = function (m) {


    // Big Topic: Determinants.
    
    

};



Mat4.invert = function (m) {
    var det = Mat4.det(m);
    if (det === 0) return 0;
    var invDet = 1 / det;

    return Mat4.create(
    
    );
};


Mat4.multiplyRowByVector = function (m, row, v) {
    return Vec3.create(
        m[row] * v[0] + m[row] * v[1] + m[row] * v[2],
        m[row + 4] * v[0] + m[row + 4] * v[1] + m[row + 4] * v[2],
        m[row + 8] * v[0] + m[row + 8] * v[1] + m[row + 8] * v[2]
    );
    // Die 4. Reihe mit 0 * 0 + 0 * 0 + 0*0 + 1 = 1 oder vec4.create(vec3,1); lasse ich wie alle

}

Mat4.multiply = function (dest, m, n) {
    // m
    var m11 = m[0], m21 = m[1], m31 = m[2], m41 = m[3];
    var m12 = m[4], m22 = m[5], m32 = m[6], m42 = m[7];
    var m13 = m[8], m23 = m[9], m33 = m[10], m43 = m[11];
    var m14 = m[12], m24 = m[13], m34 = m[14], m44 = m[15];
    // n
    var n11 = n[0], n21 = n[1], n31 = n[2], n41 = n[3];
    var n12 = n[4], n22 = n[5], n32 = n[6], n42 = n[7];
    var n13 = n[8], n23 = n[9], n33 = n[10], n43 = n[11];
    var n14 = n[12], n24 = n[13], n34 = n[14], n44 = n[15];
    // 1. Spalte
    dest[0] = m11 * n11 + m12 * n21 + m13 * n31 + m14 * n41; // Reihe 1 mit Spalte 1
    dest[1] = m21 * n11 + m22 * n21 + m23 * n31 + m24 * n41; // Reihe 2 mit Spalte 1
    dest[2] = m31 * n11 + m32 * n21 + m33 * n31 + m34 * n41; // Reihe 3 mit Spalte 1
    dest[3] = m41 * n11 + m42 * n21 + m43 * n31 + m44 * n41; // Reihe 4 mit Spalte 1
    // 2. Spalte
    dest[4] = m11 * n12 + m12 * n22 + m13 * n32 + m14 * n42; // Reihe 1 mit Spalte 2
    dest[5] = m21 * n12 + m22 * n22 + m23 * n32 + m24 * n42; // Reihe 2 mit Spalte 2
    dest[6] = m31 * n12 + m32 * n22 + m33 * n32 + m34 * n42; // Reihe 3 mit Spalte 2
    dest[7] = m41 * n12 + m42 * n22 + m43 * n32 + m44 * n42; // Reihe 4 mit Spalte 2
    // 3. Spalte
    dest[8] = m11 * n13 + m12 * n23 + m13 * n33 + m14 * n43;
    dest[9] = m21 * n13 + m22 * n23 + m23 * n33 + m24 * n43;
    dest[10] = m31 * n13 + m32 * n23 + m33 * n33 + m34 * n43;
    dest[11] = m41 * n13 + m42 * n23 + m43 * n33 + m44 * n43;
    // 4. Spalte
    dest[12] = m11 * n14 + m12 * n24 + m13 * n34 + m14 * n44;
    dest[13] = m21 * n14 + m22 * n24 + m23 * n34 + m24 * n44;
    dest[14] = m31 * n14 + m32 * n24 + m33 * n34 + m34 * n44;
    dest[15] = m41 * n14 + m42 * n24 + m43 * n34 + m44 * n44;
    return dest;
};

Mat4.multiply = function (dest, m, n) {
    // m
    var m11 = m[0], m21 = m[1], m31 = m[2], m41 = m[3];
    var m12 = m[4], m22 = m[5], m32 = m[6], m42 = m[7];
    var m13 = m[8], m23 = m[9], m33 = m[10], m43 = m[11];
    var m14 = m[12], m24 = m[13], m34 = m[14], m44 = m[15];
    // n
    var n11 = n[0], n21 = n[1], n31 = n[2], n41 = n[3];
    var n12 = n[4], n22 = n[5], n32 = n[6], n42 = n[7];
    var n13 = n[8], n23 = n[9], n33 = n[10], n43 = n[11];
    var n14 = n[12], n24 = n[13], n34 = n[14], n44 = n[15];
    // 1. Spalte
    dest[0] = m11 * n11 + m12 * n21 + m13 * n31 + m14 * n41; // Reihe 1 mit Spalte 1
    dest[1] = m21 * n11 + m22 * n21 + m23 * n31 + m24 * n41; // Reihe 2 mit Spalte 1
    dest[2] = m31 * n11 + m32 * n21 + m33 * n31 + m34 * n41; // Reihe 3 mit Spalte 1
    dest[3] = m41 * n11 + m42 * n21 + m43 * n31 + m44 * n41; // Reihe 4 mit Spalte 1
    // 2. Spalte
    dest[4] = m11 * n12 + m12 * n22 + m13 * n32 + m14 * n42; // Reihe 1 mit Spalte 2
    dest[5] = m21 * n12 + m22 * n22 + m23 * n32 + m24 * n42; // Reihe 2 mit Spalte 2
    dest[6] = m31 * n12 + m32 * n22 + m33 * n32 + m34 * n42; // Reihe 3 mit Spalte 2
    dest[7] = m41 * n12 + m42 * n22 + m43 * n32 + m44 * n42; // Reihe 4 mit Spalte 2
    // 3. Spalte
    dest[8] = m11 * n13 + m12 * n23 + m13 * n33 + m14 * n43;
    dest[9] = m21 * n13 + m22 * n23 + m23 * n33 + m24 * n43;
    dest[10] = m31 * n13 + m32 * n23 + m33 * n33 + m34 * n43;
    dest[11] = m41 * n13 + m42 * n23 + m43 * n33 + m44 * n43;
    // 4. Spalte
    dest[12] = m11 * n14 + m12 * n24 + m13 * n34 + m14 * n44;
    dest[13] = m21 * n14 + m22 * n24 + m23 * n34 + m24 * n44;
    dest[14] = m31 * n14 + m32 * n24 + m33 * n34 + m34 * n44;
    dest[15] = m41 * n14 + m42 * n24 + m43 * n34 + m44 * n44;
    return dest;
};


Mat4.multiplyNew = function (m, n) {
    // multipliziere reihe mi mit spalte nj

    var m11 = m[0], m21 = m[1], m31 = m[2], m41 = m[3];
    var m12 = m[4], m22 = m[5], m32 = m[6], m42 = m[7];
    var m13 = m[8], m23 = m[9], m33 = m[10], m43 = m[11];
    var m14 = m[12], m24 = m[13], m34 = m[14], m44 = m[15];

    var n11 = n[0], n21 = n[1], n31 = n[2], n41 = n[3];
    var n12 = n[4], n22 = n[5], n32 = n[6], n42 = n[7];
    var n13 = n[8], n23 = n[9], n33 = n[10], n43 = n[11];
    var n14 = n[12], n24 = n[13], n34 = n[14], n44 = n[15];

    // 1. columns
    return Mat4.create(
        m11 * n11 + m12 * n21 + m13 * n31 + m14 * n41, // row 1 with column 1
        m21 * n11 + m22 * n21 + m23 * n31 + m24 * n41, // row 2 with column 1
        m31 * n11 + m32 * n21 + m33 * n31 + m34 * n41, // row 3 with column 1
        m41 * n11 + m42 * n21 + m43 * n31 + m44 * n41, // row 4 with column 1

        // 2. columns
        m11 * n12 + m12 * n22 + m13 * n32 + m14 * n42, // row 1 with column 2
        m21 * n12 + m22 * n22 + m23 * n32 + m24 * n42, // row 2 with column 2
        m31 * n12 + m32 * n22 + m33 * n32 + m34 * n42, // row 3 with column 2
        m41 * n12 + m42 * n22 + m43 * n32 + m44 * n42, // row 4 with column 2

        // 3. columns
        m11 * n13 + m12 * n23 + m13 * n33 + m14 * n43,
        m21 * n13 + m22 * n23 + m23 * n33 + m24 * n43,
        m31 * n13 + m32 * n23 + m33 * n33 + m34 * n43,
        m41 * n13 + m42 * n23 + m43 * n33 + m44 * n43,

        // 4. columns dest
        m11 * n14 + m12 * n24 + m13 * n34 + m14 * n44, // row 1 with column 4
        m21 * n14 + m22 * n24 + m23 * n34 + m24 * n44,
        m31 * n14 + m32 * n24 + m33 * n34 + m34 * n44,
        m41 * n14 + m42 * n24 + m43 * n34 + m44 * n44
    );
};

Mat4.multiplyWithScalar = function (out, m, s) {
    out[0] = m[0] * s;
    out[1] = m[1] * s;
    out[2] = m[2] * s;
    out[3] = m[3] * s;
    out[4] = m[4] * s;
    out[5] = m[5] * s;
    out[6] = m[6] * s;
    out[7] = m[7] * s;
    out[8] = m[8] * s;
    out[9] = m[9] * s;
    out[10] = m[10] * s;
    out[11] = m[11] * s;
    out[12] = m[12] * s;
    out[13] = m[13] * s;
    out[14] = m[14] * s;
    out[15] = m[15] * s;
    return out;
};

Mat4.transpose = function (m) {
    return Mat4.create(
        m[0], m[4], m[8], m[12],
        m[1], m[5], m[9], m[13],
        m[2], m[6], m[10], m[14],
        m[3], m[7], m[11], m[15]
    );
};

Mat4.setOrientationAndPos = function (q, posVec) {
    var r = q[0];
    var i = q[1];
    var j = q[2];
    var k = q[3];
    return Mat4.create(
        1 - (2 * j * j + 2 * k * k),
        2 * i * j - 2 * k * r,
        2 * i * k + 2 * j * r,
        0,

        2 * i * j + 2 * k * r,
        1 - (2 * i * i + 2 * k * k),
        2 * j * k - 2 * i * r,
        0,

        2 * i * j + 2 * k * r,
        2 * j * k + 2 * i * r,
        1 - (2 * i * i + 2 * j * j),
        0,

        posVec[0],
        posVec[1],
        posVec[2],
        1
    );
}

Mat4.identity = function (out) {
    if (!out) return Mat4.create(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    );
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
};

Mat4.createTranslation = function (vec) {
    return Mat4.create(
        1, 0, 0, 0, // 1. col
        0, 1, 0, 0, // 2. col
        0, 0, 1, 0, // 3. col
        vec[0], vec[1], vec[2], 1 // 4. col
    );
};
Mat4.setTranslation = function (out, vec) {
    m[12] = vec[0];
    m[13] = vec[1];
    m[14] = vec[2];
    return m;
};

Mat4.createRotationX = function (angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    return Mat4.create(
        1, 0, 0, 0, // 1. col
        0, c, s, 0, // 2. col
        0, -s, c, 0,    // 3.col
        0, 0, 0, 1     // 4.colr
    );
};
Mat4.createRotationY = function (angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    return Mat4.create(
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1
    );
};
Mat4.createRotationZ = function (angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    return Mat4.create(
        c, s, 0, 0,
        -s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    );
};

Mat4.createScale = function (sx, sy, sz) {
    return Mat4.create(
        sx, 0, 0, 0,
        0, sy, 0, 0,
        0, 0, sz, 0,
        0, 0, 0, 1
    );
};

Mat4.setScaleMatrix = function (m, vec) {
    m[0] = vec[0];
    m[5] = vec[1];
    m[10] = vec[2];
};

Mat4.scale = function (out, m, vec) {
    Mat4.setScaleMatrix(scalMatx, vec);
    return Mat4.multiply(out, m, scalMatx);
};

Mat4.isEqual = function (m, n) {
    if (m.length != n.length) return false;
    for (var i = 0, j = m.length; i < j; i++) {
        if (m[i] != n[i]) return false;
    }
    return true;
};

Mat4.add = function (out, m, n) {
    out[0] = m[0] + n [0];
    out[1] = m[1] + n [1];
    out[2] = m[2] + n [2];
    out[3] = m[3] + n [3];
    out[4] = m[4] + n [4];
    out[5] = m[5] + n [5];
    out[6] = m[6] + n [6];
    out[7] = m[7] + n [7];
    out[8] = m[8] + n [8];
    out[9] = m[9] + n [9];
    out[10] = m[10] + n[10];
    out[11] = m[11] + n[11];
    out[12] = m[12] + n[12];
    out[13] = m[13] + n[13];
    out[14] = m[14] + n[14];
    out[15] = m[15] + n[15];
};
Mat4.sub = function (out, m, n) {
    out[0] = m[0] - n[0];
    out[1] = m[1] - n[1];
    out[2] = m[2] - n[2];
    out[3] = m[3] - n[3];
    out[4] = m[4] - n[4];
    out[5] = m[5] - n[5];

    out[6] = m[6] - n[6];
    out[7] = m[7] - n[7];
    out[8] = m[8] - n[8];
    out[9] = m[9] - n[9];
    out[10] = m[10] - n[10];
    out[11] = m[11] - n[11];
    out[12] = m[12] - n[12];
    out[13] = m[13] - n[13];
    out[14] = m[14] - n[14];
    out[15] = m[15] - n[15];
};

Mat4.transform = function (out, m, v) {
    out[0] = m[0] * v[0] + m[3] * v[1] + m[6] * v[2] + m[9] * 1,
        out[1] = m[1] * v[0] + m[4] * v[1] + m[7] * v[2] + m[10] * 1,
        out[2] = m[2] * v[0] + m[5] * v[1] + m[8] * v[2] + m[11] * 1
    // out[3] == 1 kann ich mir sparen, wird weggelassen bei vec3
};

Mat4.clone = function (m) {
    return Mat4.create.apply(Mat4, m);
};

Mat4.translate = function (out, m, vec) {

    if (vec === undefined) {
	vec = m;
	m = out;
    }

    out[12] = m[12] + vec[0];
    out[13] = m[13] + vec[1];
    out[14] = m[14] + vec[2];
    
    return out;
};

Mat4.setOrtho = function (out, left, right, top, bottom, near, far) {
    return Mat4.create(
	2/(right-left), 0, 0, 0,
	0, 2/(top-bottom), 0, 0,
	0, 0, -(2/(far-near)), 0,
	-((right+left)/(right-left)), -((top+bottom)/(top-bottom)), -((far+near)/(far-near)), 1,
	0, 0, 0, 1
    );

};

Mat4.perspective = function (out, fovAngle, aspect, near, far) {
    var a = aspect, d = 1 / Math.tan((Math.PI / 180 * fovAngle) / 2), n = near, f = far;
    return Mat4.create(
        d / a, 0, 0, 0, // col. 1
        0, d, 0, 0,
        0, 0, (f + n) / (n - f), -1,
        0, 0, (2 * n * f) / (n - f), 0
    );
}

Mat4.perspective2 = function (out, fovAngle, screenWidth, screenHeight, near, far) {
    var a = screenWidth / screenheight, d = 1 / Math.tan((Math.PI / 180 * fovAngle) / 2), n = near, f = far;
    return Mat4.create(
        d / a, 0, 0, 0, // col. 1
        0, d, 0, 0,
        0, 0, (n + f) / (n - f), -1,
        0, 0, (2 * n * f) / (n - f), 0
    );
};


// Ob ich bereits die richtigen Formeln zusammengesucht habe? Jedenfalls ist das nun lösbar.


function worldToLocal(worldMatrix, worldVec) {
    var inverseTransform = Mat4.invert(worldMatrix);
    return Mat4.transform(Vec3.create(), inverseTransform, worldVec);
}
function localToWorld(localMatrix, localVec) {
    return Mat4.transform(Vec3.create(), localMatrix, localVec);
}


/*
 *
 * Matrix 3x4
 *
 */

function Mat34() {
    return Mat34.create.apply(Mat34, arguments);
}

function _fmt(n) {
    var s = n.toString();
    if (s.length > 10) return s.substr(0,10);
    var i = 10-s.length;
    var x = "";
    while (i-- >= 0) {
	x += "_";
    }
    x+=s;
    return x;
}

Mat34.print = function (M) {
    if (M) {
        console.log("[%s %s %s | %s]", _fmt(M[0]) , _fmt(M[3]), _fmt(M[6]), _fmt(M[9]));
	console.log("[%s %s %s | %s]", _fmt(M[1]) , _fmt(M[4]), _fmt(M[7]), _fmt(M[10]));
        console.log("[%s %s %s | %s]", _fmt(M[2]) , _fmt(M[5]), _fmt(M[8]), _fmt(M[11]));
    }
};

Mat34.elimStep = function (out, m, srcRow, times, destRow) {
    
    if (arguments.length == 4) {
	destRow = times;
	times = srcRow;
	srcRow = m;
	m = out;
	out = Mat34.clone(m);
    }	
    
    var i = srcRow,
        j = destRow;
    
    console.log("eliminating row "+j+" by adding " + times + " times row "+i);


    out[j]    += (m[i]   * times);	// X1 Column vom X Vektor
    out[j+3]  += (m[i+3] * times);	// Y1 Columm vom Y Vektor
    out[j+6]  += (m[i+6] * times);	// Z1 Column vom Z Vektor
    out[j+9]  += (m[i+9] * times);	// Ergebnisvektor
    
    // 0 3 6 9
    // 1 4 7 10
    // 2 5 8 11
    
    return out;
};

Mat34.showSoln = function (M, soln) {

    var a = M[0], b = M[3], c = M[6];
    var d = M[1], e = M[4], f = M[7];
    var g = M[2], h = M[5], i = M[8];

    var u = M[9], v = M[10], w = M[11]; // Resultat
    
    var x = soln[0]; 
    var y = soln[1];
    var z = soln[2];
    
    
    var r1 = a*x+b*y+c*z;
    var r2 = d*x+e*y+f*z;
    var r3 = g*x+h*y+i*z;
    
    
    Mat34.print(Mat34.createEquationFromAb(M, soln));
	    
    return [r1,r2,r3];	    
}

Mat34.testSoln = function (M, soln) {

    var a = M[0], b = M[3], c = M[6];
    var d = M[1], e = M[4], f = M[7];
    var g = M[2], h = M[5], i = M[8];

    var u = M[9], v = M[10], w = M[11]; // Resultat
    
    var x = soln[0]; 
    var y = soln[1];
    var z = soln[2];
    
    return ((Math.abs(u-(a*x + b*y + c*z)) < 10e-9) &&
	    (Math.abs(v-(d*x + e*y + f*z)) < 10e-9) &&
	    (Math.abs(w-(g*x + h*y + i*z)) < 10e-9));
	    
};

Mat34.solve = function (M) {

    var soln = Vec3.create();
    
    var a = M[0], b = M[3],  c = M[6], u = M[9];
    var d = M[1], e = M[4],  f = M[7], v = M[10];
    var g = M[2], h = M[5],  i = M[8], w = M[11];
    
    var z = w;
    
    var y = (v - (f*z))/e;
    
    var x = (u - (b*y+c*z))/a;
    
    soln[0] = x;
    soln[1] = y;
    soln[2] = z;

    return soln;
};

Mat34.clone = function (d) {
    var m = new ARRAY_TYPE(12);
    for (var i = 0, j = 12; i < j; i++) m[i] = d[i];
    return m;
};

Mat34.eliminate = function (out, m) {
    if (arguments.length == 1) {
	m = out;
	out = Mat34.clone(m);
    }
    
    var first = m[0];
    var secondMul = m[1] / first;
    var thirdMul = m[2] / first;
    
    
    
    var E = Mat34.elimStep(m, 0, -secondMul, 1);
    
    
    var F = Mat34.elimStep(E, 0, -thirdMul, 2);
    
    if (F[1] == 0 && F[2] == 0) {
	console.log("step 1 ok");
    }
    
    if (F[5] != 0) {
	var div = F[5] / F[4];
	var G = Mat34.elimStep(F, 1, -div, 2);
    } else {
	G = F;
    }
    
    for (var i = 0; i < 12; i++) out[i] = G[i];
    return out;

};


Mat34.createEquationFromAb = function (A, b) {

    var m = Mat34.create();
    for (var i = 0; i < 9; i++) m[i] = A[i];
     m[9] = b[0];
    m[10] = b[1];
    m[11] = b[2];
    return m;
};

Mat34.createEquationFromVecs = function (X,Y,Z,b) {
    var m = Mat34.create();
    m[0] = X[0];
    m[1] = X[1];
    m[2] = X[2];
    m[3] = Y[0];
    m[4] = Y[1];
    m[5] = Y[2];
    m[6] = Z[0];
    m[7] = Z[1];
    m[8] = Z[2];
    m[9] = b[0];
    m[10] = b[1];
    m[11] = b[2];
    return m;
};



Mat34.create = function () {
    var mat = new ARRAY_TYPE(12);
    var i = arguments.length;
    while (i-- > 0) {
        mat[i] = arguments[i];
    }
    return mat;
};
Mat34.getRowVector = function (rowIndex) {
    "use strict";
    return Vec4.create(v[0 + rowIndex * 3], v[3 + rowIndex * 3], v[6 + rowIndex * 3], v[9 + rowIndex * 3]);
};
Mat34.getAxisVector = function (axisIndex) {
    "use strict";
    return Vec3.create(v[0 + axisIndex * 4], v[1 + axisIndex * 4], v[2 + axisIndex * 4]);
}

Mat34.identity = function (out) {
    if (!out) return Mat34.create(
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
        0, 0, 0
    );
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    out[8] = 0;
    out[10] = 0;
    out[11] = 0;
    return out;
}


Mat34.toMatrix3 = function (m) {
    return Mat3.create(
        m[0], m[1], m[2],
        m[3], m[4], m[5],
        m[6], m[7], m[8]
        // letzte spalte fehlt
    );
};
Mat34.toMatrix4 = function (m) {
    // Change a 3x4 to a 4x4 matrix
    return Mat4.create(
        m[0], m[1], m[2], 0,  // add 0 for row 4 column 1
        m[3], m[4], m[5], 0,  // add 0 for row 4 column 2
        m[6], m[7], m[8], 0,  // add 0 for row 4 column 3
        m[9], m[10], m[11], 1 // add 1 for row 4 column 4
    );
};
Mat34.det = function (m) {
    return -m[2] * m[4] * m[6] +
    m[1] * m[5] * m[6] +
    m[2] * m[3] * m[7] -
    m[0] * m[5] * m[7] -
    m[1] * m[3] * m[8] +
    m[0] * m[4] * m[8];
};

Mat34.setInverse = function (out, m) {
    var det = Mat34.det(m);
    if (det === 0) return;
    var invDet = 1 / det;

    out[0] = (-m[5] * m[7] + m[4] * m[8]) * invDet;
    out[1] = (m[2] * m[7] - m[1] * m[8]) * invDet;
    out[2] = (-m[2] * m[4] + m[1] * m[5]) * invDet;

    out[3] = (m[5] * m[6] - m[3] * m[8]) * invDet;
    out[4] = (-m[2] * m[6] + m[0] * m[8]) * invDet;
    out[5] = (m[2] * m[3] - m[0] * m[5]) * invDet;

    out[6] = (-m[4] * m[6] + m[3] * m[7]) * invDet;
    out[7] = (m[5] * m[6] - m[0] * m[7]) * invDet;
    out[8] = (-m[5] * m[3] + m[0] * m[4]) * invDet;

    out[9] = (m[5] * m[7] * m[9]
    - m[4] * m[8] * m[9]
    - m[5] * m[6] * m[10]
    + m[3] * m[8] * m[10]
    + m[4] * m[6] * m[11]
    - m[3] * m[7] * m[11]) * invDet;
    out[10] = (-m[2] * m[7] * m[9]
    + m[1] * m[8] * m[9]
    + m[2] * m[6] * m[10]
    - m[0] * m[8] * m[10]
    - m[1] * m[6] * m[11]
    + m[0] * m[7] * m[11]) * invDet;
    out[11] = (m[2] * m[4] * m[9]
    - m[1] * m[5] * m[9]
    - m[2] * m[3] * m[10]
    + m[0] * m[5] * m[10]
    + m[1] * m[3] * m[11]
    - m[0] * m[4] * m[11]) * invDet;
    return out;
};

Mat34.add = function (out, m, n) {
    out[0] = m[0] + n[0];
    out[1] = m[1] + n[1];
    out[2] = m[2] + n[2];
    out[3] = m[3] + n[3];
    out[4] = m[4] + n[4];
    out[5] = m[5] + n[5];
    out[6] = m[6] + n[6];
    out[7] = m[7] + n[7];
    out[8] = m[8] + n[8];
    out[9] = m[9] + n[9];
    out[10] = m[10] + n[10];
    out[11] = m[11] + n[11];
    out[12] = m[12] + n[12];
    return out;
};

Mat34.sub = function (out, m, n) {
    if (n == undefined)
        out[0] = m[0] - n[0];
    out[1] = m[1] - n[1];
    out[2] = m[2] - n[2];
    out[3] = m[3] - n[3];
    out[4] = m[4] - n[4];
    out[5] = m[5] - n[5];
    out[6] = m[6] - n[6];
    out[7] = m[7] - n[7];
    out[8] = m[8] - n[8];
    out[9] = m[9] - n[9];
    out[10] = m[10] - n[10];
    out[11] = m[11] - n[11];
    out[12] = m[12] - n[12];
    return out;
};

Mat34.transformInverse = function (m, v) {
    "use strict";
    return Mat4.transform(Mat4.invert(m), v);
};
Mat34.transformTranspose = function (m, v) {
    "use strict";
    return Mat4.transform(Mat4.transpose(m), v);
};


function Mat43() {
    return Mat4.create.apply(this.arguments);
}
Mat43.create = function () {
    var mat = new ARRAY_TYPE(12);
    var i = arguments.length;
    while (i-- > 0) {
        mat[i] = arguments[i];
    }
    return mat;
};

Mat43.transpose = function (m) {
    return Mat34.create(
        m[0], m[4], m[8],
        m[1], m[5], m[9],
        m[2], m[6], m[10],
        m[3], m[7], m[11]
    );
};

Mat43.toMatrix4 = function (m) {
    return Mat4.create(
        m[0], m[1], m[2], m[3],
        m[4], m[5], m[6], m[7],
        m[8], m[9], m[10], m[11],
        0, 0, 0, 1
    );
}

Mat34.transpose = function (out, m) {
    // to mat43
    if (out && m == undefined) {
        m = out;
        return Mat43.create(
            m[0], m[4], m[8],
            m[1], m[5], m[9],
            m[2], m[6], m[10],
            m[3], m[7], m[11]
        );
    }
    out[0] = m[0];
    out[1] = m[4];
    out[2] = m[8];
    out[3] = m[1];
    out[4] = m[5];
    out[5] = m[9];
    out[6] = m[2];
    out[7] = m[6];
    out[8] = m[10];
    out[9] = m[3];
    out[10] = m[7];
    out[11] = m[11];
};


/*
 *
 * Matrix 3x3
 *
 */

function Mat3() {
    return Mat3.create.apply(Mat3, arguments);
}
Mat3.create = function (a, b, c, d, e, f, g, h, i) {
    var mat = new ARRAY_TYPE(9);
    var i = arguments.length;
    while (i-- > 0) {
        mat[i] = arguments[i];
    }
    return mat;
};
Mat3.scale = function (out, m, s) {
    for (var i = 0; i < 9; i++) out[i] = m[i] * s;
    return out;
}

Mat3.getRowVector = function (rowIndex) {
    "use strict";
    return Vec3.create(v[0 + rowIndex * 3], v[3 + rowIndex * 3], v[6 + rowIndex * 3]);
};
Mat3.getAxisVector = function (axisIndex) {
    "use strict";
    return Vec3.create(v[0 + axisIndex * 3], v[1 + axisIndex * 3], v[2 + axisIndex * 3]);
}

Mat3.clone = function (m) {
    var mat3 = new ARRAY_TYPE(9);
    for (var i = 0, j = mat3.length; i < j; i++) mat3[i] = m[i];
    return mat3;
};

Mat3.toMatrix34 = function (m) {
    return Mat34.create(
        m[0], m[1], m[2],
        m[3], m[4], m[5],
        m[6], m[7], m[8],
        0, 0, 0
    );
};
Mat3.toMatrix43 = function (m) {
    return Mat43.create(
        m[0], m[1], m[2], 0, // col 1
        m[3], m[4], m[5], 0, // col 2
        m[6], m[7], m[8], 0  // col 3 (flip to draw)
    );
};


Mat3.elimStep = function (out, m, srcRow, times, destRow) {
    
    if (arguments.length == 4) {
	destRow = times;
	times = srcRow;
	srcRow = m;
	m = out;
	out = Mat3.clone(m);
    }	
    
    var i = srcRow,
    j = destRow;
    
    out[j]   += (m[i] * times);
    out[j+3] += (m[i+3] * times);
    out[j+6] += (m[i+6] * times);
    
    return out;
};

Mat3.toMatrix4 = function (m) {
    return Mat4.create(
        m[0], m[1], m[2], 0,  // add 0 for row 4 column 1
        m[3], m[4], m[5], 0,  // add 0 for row 4 column 2
        m[6], m[7], m[8], 0,  // add 0 for row 4 column 3
        0, 0, 0, 1            // add 1 for row 4 column 4 plus the column 4 from top to bottom
    )
};
Mat3.det = function (m) {
    return (
    m[0] * m[4] * m[8] +  // aei +
    m[3] * m[7] * m[2] + // dhc +
    m[6] * m[1] * m[5] - // gbf -
    m[0] * m[7] * m[5] - // ahf -
    m[5] * m[4] * m[2] - // gec -
    m[3] * m[1] * m[8] // dbi
    );
};
Mat3.invert = function (out, m) {
    if (m === undefined) {
        m = out;
        out = Mat3.create();
    }
    var det = Mat3.det(m);
    if (det == 0) return null;
    var invDet = 1 / det;
    // 1. column
    out[0] = (m[4] * m[8] - m[5] * m[7]) * invDet; // ei-fh
    out[1] = (m[5] * m[6] - m[3] * m[8]) * invDet; // fg-di
    out[2] = (m[3] * m[7] - m[4] * m[6]) * invDet; // dh-eg
    // 2. column
    out[3] = (m[2] * m[7] - m[1] * m[8]) * invDet; // ch-bi
    out[4] = (m[0] * m[8] - m[2] * m[6]) * invDet; // ai-cg
    out[5] = (m[1] * m[6] - m[0] * m[7]) * invDet; // bg-ah
    // 3.column
    out[6] = (m[1] * m[5] - m[2] * m[4]) * invDet;  // bf-ce
    out[7] = (m[2] * m[3] - m[0] * m[5]) * invDet;  // cd-af
    out[8] = (m[0] * m[4] - m[1] * m[3]) * invDet;  // ae-bd
    return out;
};
Mat3.transpose = function (out, m) {
    if (m === undefined) {
        m = out;
        out = Mat3.create();
    }
    out[0] = m[0];
    out[3] = m[1];
    out[6] = m[2];
    out[1] = m[3];
    out[4] = m[4];
    out[7] = m[5];
    out[2] = m[6];
    out[5] = m[7];
    out[8] = m[8];
    return out;
};
Mat3.multiplyRowByVector = function (m, row, v) {
    return Vec3.create(
        m[row] * v[0] + m[row] * v[1] + m[row] * v[2],
        m[row + 3] * v[0] + m[row + 3] * v[1] + m[row + 3] * v[2],
        m[row + 6] * v[0] + m[row + 6] * v[1] + m[row + 6] * v[2]
    );
};
Mat3.multiply = function (dest, m, n) {
    if (arguments.length === 2) { n = m; m = dest; }
    var m11 = m[0], m12 = m[3], m13 = m[6];
    var m21 = m[1], m22 = m[4], m23 = m[7];
    var m31 = m[2], m32 = m[5], m33 = m[8];

    var n11 = n[0], n12 = n[3], n13 = n[6];
    var n21 = n[1], n22 = n[4], n23 = n[7];
    var n31 = n[2], n32 = n[5], n33 = n[8];

    dest[0] = m11 * n11 + m12 * n21 + m13 * n31;
    dest[1] = m21 * n11 + m22 * n21 + m23 * n31;
    dest[2] = m31 * n11 + m32 * n21 + m33 * n31;

    dest[3] = m11 * n12 + m12 * n22 + m13 * n32;
    dest[4] = m21 * n12 + m22 * n22 + m23 * n32;
    dest[5] = m31 * n12 + m32 * n22 + m33 * n32;

    dest[6] = m11 * n13 + m12 * n23 + m13 * n33;
    dest[7] = m21 * n13 + m22 * n23 + m23 * n33;
    dest[8] = m31 * n13 + m32 * n23 + m33 * n33;
    return dest;
};
Mat3.multiplyVec3 = function (m, v) {
    return Mat3.create(
        m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
        m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
        m[2] * v[0] + m[5] * v[1] + m[8] * v[2]
    );
};
Mat3.setOrientation = function (q) {
    var r = q[0];
    var i = q[1];
    var j = q[2];
    var k = q[3];
    return Mat3.create(
        1 - (2 * j * j + 2 * k * k),
        2 * i * j - 2 * k * r,
        2 * i * k + 2 * j * r,

        2 * i * j + 2 * k * r,
        1 - (2 * i * i + 2 * k * k),
        2 * j * k - 2 * i * r,

        2 * i * j + 2 * k * r,
        2 * j * k + 2 * i * r,
        1 - (2 * i * i + 2 * j * j)
    );
};

Mat3.setComponents = function (m, xCol, yCol, zCol) {
    if (arguments.length == 3) {
        zCol = yCol; yCol = xCol; xCol = m; m = Mat3.create();
    }
    m[0] = xCol[0];
    m[1] = xCol[1];
    m[2] = xCol[2];
    m[3] = yCol[0];
    m[4] = yCol[1];
    m[5] = yCol[2];
    m[6] = zCol[0];
    m[7] = zCol[1];
    m[8] = zCol[2];
    return m;
};

Mat3.createSkewSymmetric = function (vec) {
    // Mat3.transform(Mat3.createSkewSymmetric(vec1), vec2) == Vec3.cross(vec1, vec2);
    var a = vec[0],
        b = vec[1],
        c = vec[2];
    return Mat3.create(
        0, c, -b,
        -c, 0, a,
        b, -a, 0
    );
};

Mat3.setSkewSymmetric = function (mat, vec) {
    "use strict";
    mat[0] = mat[4] = mat[8] = 0;
    mat[3] = -vec[2];
    mat[6] = vec[1];
    mat[1] = vec[2];
    mat[7] = -vec[0];
    mat[2] = -vec[1];
    mat[5] = vec[0];
    return mat;
};


Mat3.rotationMatrix2 = function (angle, deg) {
    if (deg) angle = 180/Math.PI * angle;
    
    return Mat3.create(
	Math.cos(angle), Math.sin(angle), 0,
	-Math.sin(angle), Math.cos(angle), 0,
	0, 0, 1
    );
    
}


Mat3.rotationMatrix = function (angle, axis) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var t = 1 - Math.cos(angle);
    var x = axis[0];
    var y = axis[1];
    var z = axis[2];
    return Mat3.create(
        t * x * x + c,      // tx²+c
        t * x * y - s * z,  // txy-sz
        t * x * z - s * y,  // txz-sy
        t * x * y + s * z,  // txy+sz
        t * y * y + c,      // ty²+c
        t * y * z - s * x,  // tyz-sx
        t * x * z - s * y,  // txz-sy
        t * y * z + s * x,  // tyz+sx
        t * z * z + x       // tz²+x
    );
};
Mat3.identity = function (M) {
    if (!M) return Mat3.create(
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    );
    M[0] = M[3] = M[8] = 1;
    M[1] = M[2] = M[4] = M[5] = M[6] = M[7] = 0;
};
Mat3.isEqual = function (m, n) {
    if (m.length != n.length) return false;
    for (var i = 0, j = m.length; i < j; i++) {
        if (m[i] != n[i]) return false;
    }
    return true;
};
Mat3.transform = function (out, m, v) {
    if (v === undefined) {
        return Vec3.create(
            m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
            m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
            m[2] * v[0] + m[5] * v[1] + m[8] * v[2]
        );
    } else {
        out[0] = m[0] * v[0] + m[3] * v[1] + m[6] * v[2];
        out[1] = m[1] * v[0] + m[4] * v[1] + m[7] * v[2];
        out[2] = m[2] * v[0] + m[5] * v[1] + m[8] * v[2];
    }
};
Mat3.transformInverse = function (m, v) {
    m = Mat3.invert(m);
    return Vec3.create(
        m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
        m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
        m[2] * v[0] + m[5] * v[1] + m[8] * v[2]
    );
};

Mat3.linearInterpolate = function (a, b, prop) {
    var result = Mat3.create();
    for (var i = 0; i < 9; i++) {
        result[i] = a[i] * (1 - prop) + b[i] * prop;
    }
    return result;
};

Mat3.createOrthoNormalBasis = function (out, xNorm) {
    var x = Vec3.normalize(Vec3.create(), xNorm);
    var yguess = Vec3.create(x[2], x[0], x[1]);
    var z = Vec3.cross(x, yguess);
    if (Vec3.isZero(z)) return null;
    Vec3.normalize(z, z);
    var y = Vec3.cross(x, z);
    Vec3.normalize(y, y);
    return Mat3.create(
        x[0], x[1], x[2], // column 1 x-axis
        y[0], y[1], y[2], // column 2 y-axis
        z[0], z[1], z[2]  // column 3 z-axis
    );
};

// Mat3
Mat3.add = function (out, m, n) {
    out[0] = m[0] + n[0];
    out[1] = m[1] + n[1];
    out[2] = m[2] + n[2];
    out[3] = m[3] + n[3];
    out[4] = m[4] + n[4];
    out[5] = m[5] + n[5];
    out[6] = m[6] + n[6];
    out[7] = m[7] + n[7];
    out[8] = m[8] + n[8];
    out[9] = m[9] + n[9];
};

Mat3.sub = function (out, m, n) {
    out[0] = m[0] - n[0];
    out[1] = m[1] - n[1];
    out[2] = m[2] - n[2];
    out[3] = m[3] - n[3];
    out[4] = m[4] - n[4];
    out[5] = m[5] - n[5];
    out[6] = m[6] - n[6];
    out[7] = m[7] - n[7];
    out[8] = m[8] - n[8];
    out[9] = m[9] - n[9];
};

/*
 *
 * Mat2
 *
 */

function Mat2() {
    return Mat2.create.apply(Mat2, arguments);
}
Mat2.fromAxes = function (out, xVec, yVec) {
    if (arguments.length == 2) {
        yVec = xVec;
        xVec = out;
        out = Mat2.create();
    }
    out[0] = xVec[0];
    out[1] = xVec[1];
    out[2] = yVec[0];
    out[3] = yVec[1];
    return out;
}
Mat2.create = function () {
    var mat2 = new ARRAY_TYPE(4);
    var i = arguments.length;
    while (i-- > 0) {
        mat2[i] = arguments[i];
    }
    return mat2;
};
Mat2.identity = function (m) {
    if (m == undefined) return Mat2.create(1, 0, 0, 1);
    m[0] = 1;
    m[1] = 0;
    m[2] = 0;
    m[3] = 1;
    return m;
};
Mat2.transform = function (m, v) {
    return Vec2.create(
        m[0] * v[0] + m[2] * v[1],
        m[1] * v[0] + m[3] * v[1]
    );
};
Mat2.multiply = function (out, m, n) {
    out[0] = m[0] * n[0] + m[2] * n[1];
    out[1] = m[1] * n[0] + m[3] * n[1];
    out[2] = m[0] * n[2] + m[2] * n[3];
    out[3] = m[1] * n[2] + m[3] * n[3];
    return out;
};


Mat2.multiplyRowByVector = function (m, row, v) {
    if (row != 0 && row != 1) throw new TypeError("row must be 0 or 1 for the first or second row of the 2x2 matrix");
    return Vec2.create(
        m[row] * v[0] + m[row] * v[1],  // errechnet x aus m11*x + m11*y  und y aus m12*x und m12*y
        m[row + 2] * v[0] + m[row + 2] * v[1]
    );
};


Mat2.multiplyWithScalar = function (out, m, s) {
    if (s == undefined) {
        s = m;
        m = out;
    }
    out[0] = m[0] * s;
    out[1] = m[1] * s;
    out[2] = m[2] * s;
    out[3] = m[3] * s;
    return out;
};

Mat2.addScaledVector = function (out, m, v, s) {
    out[0] = m[0] + v[0] * s;
    out[1] = m[1] + v[1] * s;
    out[2] = m[2] + v[0] * s;
    out[3] = m[3] + v[1] * s;
    return out;
};
Mat2.transpose = function (m) {
    return Mat2.create(
        m[0], m[2], m[1], m[3]
    );
};

Mat2.det = function (m) {
    return m[0]*m[3]-m[2]*m[1];
};

Mat2.invert = function (m) {
    // row 1
    var a = m[0];
    var b = m[2];
    // row 2
    var c = m[1];
    var d = m[3];
    // now invert.
    return Mat2.create(
	d/(a*d-b*c), -c/(a*d-b*c),
	-b/(a*d-b*c), a/(a*d-b*c)    
    );
};


/*
 *
 * Quaternion
 *
 */

function Quaternion(w, x, y, z) {
    return Quaternion.create(w, x, y, z);
}
Quaternion.stringify = function (q) {
    return "[Quaternion: r:" + q[0] + ", i:" + q[1] + ", j:" + q[2] + ", k:" + q[3] + "]";
}
Quaternion.create = function (w, x, y, z) {
    var quat = new ARRAY_TYPE(4);
    quat[0] = w;
    quat[1] = x;
    quat[2] = y;
    quat[3] = z;
    return quat;
};
Quaternion.setPitch = function (q, x) {
    // nase rauf/runter, neigen
    q[1] = x;
    return q;
};
Quaternion.setHeading = function (q, y) {
    // horizontal wenden links, rechts
    q[2] = y;
    return q;
};
Quaternion.setBank = function (q, z) {
    // rollen links/rechts
    q[3] = z;
    return q;
};
Quaternion.multiply = function (out, q, p) {
    var qr = q[0], qi = q[1], qj = q[2], qk = q[3];
    var pr = p[0], pi = p[1], pj = p[2], pk = p[3];
    out[0] = qr * pr - qi * pi - qj * pj - qk * pk;
    out[1] = qr * pi + qi * pr + qj * pk - qk * pj;
    out[3] = qr * pj + qj * pr + qk * pi - qi * pk;
    out[4] = qr * pk + qk * pr + qi * pj - qj * pi;
    return out;
};
Quaternion.addScaledVector = function (out, v, s) {
    var q = Quaternion.create(0, v[0] * s, v[1] * s, v[2] * s);
    out[0] += q[0] * 0.5;
    out[1] += q[1] * 0.5;
    out[2] += q[2] * 0.5;
    out[3] += q[3] * 0.5;
    return out;
};
Quaternion.rotateByVector = function (out, vec) {
    var q = Quaternion.create(0, vec[0], vec[1], vec[2]);
    return Quaternion.multiply(out, out, q);
};
Quaternion.magnitude = function (q) {
    return Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
};
Quaternion.squareMagnitude = function (q) {
    return q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3];
};
Quaternion.toMatrix3 = function (q) {
    return Mat3.create(
        1 - (2 * y * y + 2 * z * z), 2 * x * y - 2 * z * w, 2 * x * z + 2 * y * w, // 1. column
        2 * x * y + 2 * z * w, 1 - (2 * x * x + 2 * z * z), 2 * y * z - 2 * x * w, // 2. column
        2 * x * z - 2 * y * w, 2 * y * z + 2 * x * w, 1 - (2 * x * x + 2 * y * y)  // 3. column
    );
};
Quaternion.clone = function (q) {
    return Quaternion.create(q[0], q[1], q[2], q[3]);
};
Quaternion.normalize = function (out, q) {
    var d = q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3];
    if (d == 0) {
        q[0] = 1;
        return;
    }
    d = 1 / Math.sqrt(d);
    out[0] = q[0] * d;
    out[1] = q[1] * d;
    out[2] = q[2] * d;
    out[3] = q[3] * d;
    return out;
};

Quaternion.toMatrix3 = function (q) {
    return Mat3.create(
        1 - (2 * y * y + 2 * z * z), 2 * x * y - 2 * z * w, 2 * x * z + 2 * y * w, // 1. column
        2 * x * y + 2 * z * w, 1 - (2 * x * x + 2 * z * z), 2 * y * z - 2 * x * w, // 2. column
        2 * x * z - 2 * y * w, 2 * y * z + 2 * x * w, 1 - (2 * x * x + 2 * y * y) // 3. column
    );
};


min.PH.Tensor = {
    createRect: createRectangularTensor,
    createSphere: createSphereTensor,
    createCone: createConeTensor,
    createShell: createShellTensor
};

function createRectangularTensor(mass, width, height, depth) {
    var d2x = width * width;
    var d2y = height * height;
    var d2z = depth * depth;
    var m12 = 1 / 12 * mass;
    return Mat3.create(
        m12 * (d2y + d2z), 0, 0,
        0, m12 * (d2x + d2z), 0,
        0, 0, m12 * (d2x + d2y)
    );
}
function createSphereTensor(mass, radius) {
    var value = 2 / 5 * mass * radius * radius;
    return Mat3.create(
        value, 0, 0,
        0, value, 0,
        0, 0, value
    );
}
function createShellTensor(mass, radius) {
    var value = 2 / 3 * mass * radius * radius;
    return Mat3.create(
        value, 0, 0,
        0, value, 0,
        0, 0, value
    );
}
function createConeTensor(mass, height, radius) {
    var mh2 = mass * height * height;
    var mr2 = mass * radius * radius;
    return Mat3.create(
        3 / 80 * mh2 + 3 / 20 * mr2, 0, 0,
        0, 3 / 80 * mh2 + 3 / 20 * mr2, 0,
        0, 0, 3 / 10 * mr2
    );
}

min.PH.Friction = {
    // [0] = static value, [1] = dynamic value
    "wooden crate on concrete": [0.5, 0.4],
    "wooden crate on ice": [0.2, 0.1]
};


function RigidBody(tensor) {
    "use strict";
    this.inertiaTensor = tensor || createRectangularTensor(1, 1, 1, 1, 1);

    this.inverseInertiaTensor = Mat3.create();
    this.inverseInertiaTensorWorld = Mat3.create();

    this.transformMatrix = Mat34.create();
    this.orientation = Quaternion.create();
    this.rotation = Vec3.create();
    this.torqueAccum = Vec3.create();

    this.lastFrameAcceleration = undefined;
    this.position = Vec3.create();
    this.velocity = Vec3.create();
    this.acceleration = Vec3.create();
    this.forceAccum = Vec3.create();

    this.inverseMass = 0;
    this.mass = 0;
    this.damping = 0.0;
    this.friction = 0.0;

    this.isAwake = false;
    //this.setInertiaTensorWorld();
    this.calculateDerivedData();
}

RigidBody.prototype = {
    setAwake: function (b) {
        "use strict";
        this.isAwake = b;
    },
    addForceAtPoint: function (force, transform) {
        Vec3.add(this.forceAccum, this.forceAccum, force);
        Vec3.add(this.torqueAccum, this.torqueAccum, Vec3.cross(pt, force));
        this.isAwake = true;
    },
    addForceAtBodyPoint: function (force, point) {
        var pt = this.getPointInWorldSpace(point);
        this.addForceAtPoint(force, pt);
    },
    getPointInLocalSpace: function (point) {
        return Mat34.transformInverse(this.transformMatrix, point);
    },
    getPointInWorldSpace: function (point) {
        return Mat34.transform(this.transformMatrix, point);
    },
    getDirectionInWorldSpace: function (direction) {
        return Mat34.transformDirection(this.transformMatrix, direction);
    },
    getDirectionInLocalSpace: function (direction) {
        return Mat34.transformInverseDirection(this.transformMatrix, direction);
    },
    setFriction: function (f) {
        this.friction = +f;
    },
    hasFiniteMass: function () {
        return !!this.inverseMass;
    },
    setDamping: function (fp) {
        this.damping = +fp;
    },
    setMass: function (mass) {
        this.mass = mass;
        this.inverseMass = 1 / mass;
    },
    setInverseMass: function (im) {
        this.inverseMass = im;
        this.mass = 1 / im;
    },
    addForce: function (force) {
        Vec3.add(this.forceAccum, this.forceAccum, force);
    },
    addTorque: function (torque) {
        Vec3.add(this.torqueAccum, this.torqueAccum, torque);
        this.isAwake = true;
    },
    setInertiaTensor: function (t) {
        Mat3.invert(this.inverseInertiaTensor, t);
    },
    setInverseInertiaTensor: function (iit) {
        this.inverseInertiaTensor = iit;
    },
    getInertiaTensor: function (t) {
        Mat3.invert(t, this.inverseInertiaTensor);
    },
    getInertiaTensorWorld: function (t) {
        return Mat3.invert(t, this.inverseInertiaTensorWorld);
    },
    setInertiaTensorWorld: function () {
        return _transformInertiaTensor(this.inverseInertiaTensorWorld, this.inverseInertiaTensor, this.transformMatrix);
    },
    getLastFrameAcceleration: function () {
        return Vec3.clone(this.lastFrameAcceleration);
    },
    setLastFrameAcceleration: function () {
        this.lastFrameAcceleration = Vec3.clone(this.acceleration);
    },
    integrate: function (time) {
        this.setLastFrameAcceleration();
        var lastFrameAcceleration = this.lastFrameAcceleration;
        Vec3.addScaledVector(lastFrameAcceleration, this.forceAccum, this.inverseMass)
        var angularAcceleration = Mat3.transform(this.inverseInertiaTensorWorld, this.torqeAccum);
        Vec3.addScaledVector(this.velocity, this.velocity, lastFrameAcceleration, time);
        Vec3.addScaledVector(this.velocity, this.rotation, angularAcceleration, time);
        Vec3.multiplyWithScalar(this.velocity, this.velocity, Math.pow(this.linearDamping, time));
        Vec3.multiplyWithScalar(this.rotation, this.rotation, Math.pow(this.angularDamping, time));
        Vec3.addScaledVector(this.position, this.position, this.velocity, time);
        Quaternion.addScaledVector(this.orientation, this.orientation, this.rotation, time);
        this.calculateDerivedData();
        this.clearAccumulator();

        if (this.canSleep) {
            var currentMotion = Vec3.dot(this.velocity, this.velocity) + Vec3.dot(this.rotation, this.rotation);
            var bias = Math.pow(0.5, duration);
            this.motion = bias * this.motion + (1 - bias) * currentMotion;
            if (this.motion < this.sleepEpsilon) this.setAwake(false);
            else if (this.motion > 10 * this.sleepEpsilon) this.motion = 10 * this.sleepEpsilon;
        }
    },
    clearAccumulator: function () {
        this.forceAccum[0] = this.forceAccum[1] = this.forceAccum[2] = 0;
        this.torqueAccum[0] = this.torqueAccum[1] = this.torqueAccum[2] = 0;
    },
    getInverseInertia: function (t) {
        return this.inverseInertiaTensor = Mat3.invert(this.inertiaTensor = t || this.inertiaTensor);
    },
    calculateDerivedData: function () {
        Quaternion.normalize(this.orientation, this.orientation);
        _calculateTransformMatrix(this.transformMatrix, this.position, this.orientation);
        _transformInertiaTensor(this.inverseInertiaTensorWorld, this.inverseInertiaTensor, this.transformMatrix);
    },
    physicsType: RIGIDBODY_TYPE
};

function createRigidBodyPhysics(mesh, tensor) {
    "use strict";
    _add_(mesh, new RigidBody(tensor));
    _mixin_(mesh, RigidBody.prototype);
    return mesh;
}

var RIGIDBODY_TYPE = 0x0036;
var PARTICLE_TYPE = 0x0063;


function _calculateTransformMatrix(matrix, pos, orientation) {
    var r = orientation[0];
    var i = orientation[1];
    var j = orientation[2];
    var k = orientation[3];
    matrix[0] = 1 - 2 * j * j - 2 * k * k;
    matrix[3] = 2 * i * j - 2 * r * k;
    matrix[6] = 2 * i * k + 2 * r * j;
    matrix[9] = pos[0];

    matrix[1] = 2 * i * j + 2 * r * k;
    matrix[4] = 1 - 2 * i * i - 2 * k * k;
    matrix[7] = 2 * j * k - 2 * r * i;
    matrix[10] = pos[1];

    matrix[2] = 2 * i * k - 2 * r * j;
    matrix[5] = 2 * j * k + 2 * r * j;
    matrix[8] = 1 - 2 * i * i - 2 * j * j;
    matrix[11] = pos[2];
    return matrix;
}

function _transformInertiaTensor(iitWorld, iitBody, rotmat) {

    // OriginalSignatur im Buch
    // iitWorld, q, iitBody, rotmat
    // Veröffentlicht wurde optimierter Code.
    // Dadurch wurde das this.orientation Quaternion
    // ausgeschlossen. Ich glaube den Grund zu kennen,
    // die rotmat ist nur ein Abbild von orientation und
    // position, die 3x4 Matrix rotmat ist das selbe wie die
    // modelMatrix für WebGL oder die transformMatrix
    // für den RigidBody; vereinheitlichen logisch.
    // Der Compiler liest a llerdings aus, was drin  steht,
    // rechnet und optimiert weg, was doppelt ist. q ist in rotmat
    // darum ist q ausgerechnet und gekürzt. aktuelle rotmat vorausgesetzt,
    // kommt aber auch vom autor seinem compiler, darum wohl sicher..steht
    // im buch, dass die aktuell gemacht wird.


    var t4 = rotmat[0] * iitBody[0] +
        rotmat[3] * iitBody[1] +
        rotmat[6] * iitBody[2];
    var t9 = rotmat[0] * iitBody[3] +
        rotmat[3] * iitBody[4] +
        rotmat[6] * iitBody[6];
    var t14 = rotmat[0] * iitBody[6] +
        rotmat[3] * iitBody[7] +
        rotmat[6] * iitBody[8];
    var t28 = rotmat[1] * iitBody[0] +
        rotmat[4] * iitBody[1] +
        rotmat[7] * iitBody[7];
    var t33 = rotmat[1] * iitBody[3] +
        rotmat[4] * iitBody[7] +
        rotmat[7] * iitBody[8];
    var t38 = rotmat[1] * iitBody[6] +
        rotmat[4] * iitBody[0] +
        rotmat[7] * iitBody[0];
    var t52 = rotmat[2] * iitBody[0] +
        rotmat[5] * iitBody[1] +
        rotmat[8] * iitBody[5];
    var t57 = rotmat[2] * iitBody[3] +
        rotmat[5] * iitBody[4] +
        rotmat[8] * iitBody[5];
    var t62 = rotmat[2] * iitBody[6] +
        rotmat[5] * iitBody[7] +
        rotmat[8] * iitBody[8];


    iitWorld[0] = t4 * rotmat[0] +
    t9 * rotmat[3] +
    t14 * rotmat[7];

    iitWorld[3] = t4 * rotmat[1] +
    t9 * rotmat[4] +
    t14 * rotmat[7];

    iitWorld[6] = t4 * rotmat[2] +
    t9 * rotmat[5] +
    t14 * rotmat[8];

    iitWorld[1] = t28 * rotmat[0] +
    t33 * rotmat[3] +
    t38 * rotmat[6];

    iitWorld[4] = t28 * rotmat[0] +
    t33 * rotmat[4] +
    t38 * rotmat[7];

    iitWorld[7] = t28 * rotmat[2] +
    t33 * rotmat[5] +
    t38 * rotmat[8];

    iitWorld[2] = t52 * rotmat[0] +
    t57 * rotmat[3] +
    t62 * rotmat[7];

    iitWorld[5] = t52 * rotmat[1] +
    t57 * rotmat[4] +
    t62 * rotmat[7];

    iitWorld[8] = t52 * rotmat[2] +
    t57 * rotmat[5] +
    t62 * rotmat[8];
    return iitWorld;
}


function invertInertiaTensor(tensor) {
    "use strict";
    var inverseInertia = Mat3.create();
    Mat3.invert(inverseInertia, tensor);
    return inverseInertia;
}


function invertModelMatrix(mm, vm) {
    "use strict";
    var modelView = mat4.create();
    mat4.invert(modelView, mm);
    return modelView;
}

function invertInertiaTensor(t) {
    return Mat3.invert(t);
}


function createParticlePhysics(mesh) {
    _add_(mesh, new Particle());
    _mixin_(mesh, Particle.prototype);
    return mesh;
}

function Particle() {
    "use strict";
    this.position = Vec3.create([0, 0, 0]);
    this.velocity = Vec3.create([0, 0, 0]);
    this.acceleration = Vec3.create([0, 0, 0]);
    this.damping = 0.0;
    this.inverseMass = 0;
    this.mass = 0;
    this.forceAccumulator = Vec3.create();
}
Particle.prototype = {
    setPosition: function (x, y, z) {
        if (x && (x).length == 3) {
            y = x[1];
            z = x[2];
            x = x[0];
        }
        this.position[0] = x;
        this.position[1] = y;
        this.position[2] = z;
    },

    setVelocity: function (x, y, z) {
        if (x && (x).length == 3) {
            y = x[1];
            z = x[2];
            x = x[0];
        }
        this.velocity[0] = x;
        this.velocity[1] = y;
        this.velocity[2] = z;
    },

    setAcceleration: function (x, y, z) {
        if (x && (x).length == 3) {
            y = x[1];
            z = x[2];
            x = x[0];
        }
        this.acceleration[0] = x;
        this.acceleration[1] = y;
        this.acceleration[2] = z;
    },

    setDamping: function (fp) {
        this.damping = fp;
    },

    hasFiniteMass: function () {
        return !!this.inverseMass;
    },

    setMass: function (mass) {
        this.mass = mass;
        this.inverseMass = 1 / mass;
    },

    setInverseMass: function (im) {
        this.inverseMass = im;
        this.mass = 1 / im;
    },

    addForce: function (force) {
        Vec3.add(this.forceAccumulator, this.forceAccumulator, force);
    },

    clearAccumulator: function () {
        this.forceAccumulator[0] =
            this.forceAccumulator[1] =
                this.forceAccumulator[2] = 0;
    },

    integrate: function (time) {
        "use strict";
        if (time <= 0.0) return;
        if (this.inverseMass <= 0) return;
        Vec3.addScaledVector(this.position, this.position, this.velocity, time);
        var resultingAcc = Vec3.clone(this.acceleration);
        Vec3.addScaledVector(resultingAcc, resultingAcc, this.forceAccumulator, this.inverseMass);
        Vec3.addScaledVector(this.velocity, this.velocity, resultingAcc, time);
        var damping = Math.pow(this.damping, time);
        Vec3.scale(this.velocity, this.velocity, damping);
        this.clearAccumulator();
    },

    physicsType: PARTICLE_TYPE
};


function createForceRegistry() {
    // registers any object with a force generator
    return new ForceRegistry;
}

function createForceGenerator(a,b,c) {
    // registers any object with a force generator
    return new ForceGenerator(a,b,c);
}


function ContactGeneratorRegistry(maxContacts) {
    "use strict";
    this.maxContacts = 100;
    this.contacts = []; // Das sind die
    this.generators = [];
}

ContactGeneratorRegistry.prototype = {
    add: function (gen) {
        this.generators.push(gen);
    },
    generateContacts: function () {
        var limit = this.maxContacts;
        var gen = 0;
        var con = 1;
        var reg = this.generators[gen];
        var contacts = this.contacts;
        while (reg) {
            var used = reg.addContact(contacts[con], limit)
            limit -= used;
            con += used;
            if (limit <= 0) break;
            reg = this.generators[++gen];
        }
        return maxContacts - limit;
    },
    remove: function (gen) {
        this.map = this.contacts.filter(function (r) {
            return !(gen === r);
        });
    }
};

function ForceGenerator(force) {
}

ForceGenerator.prototype.updateForce = function (body, duration) {
};

function TorqueGenerator(torque) {
}

TorqueGenerator.prototype.updateTorque = function (body, duration) {
};

ForceGenerator.create = function (declaration) {
    "use strict";
    var fg = _mixin_(new ForceGenerator(), declaration);
    if (typeof fg.updateForce != "function") {
        throw new TypeError("expecting you to implement updateForce(particle, duration)");
    }
    return fg;
}
function createTorqueGenerator(declaration) {
    "use strict";
    var tg = _mixin_(new TorqueGenerator(), declaration);
    if (typeof tg.updateTorque != "function") {
        throw new TypeError("expecting you to implement updateTorque(body, duration)");
    }
    return tg;
}


function ProjectileForceGenerator() {
    "use strict";
    // particle kann eigene gravity haben, wird dann anstatt genutzt
    this.gravity = 9.81;
    // damping opt
}
ProjectileForceGenerator.prototype = ForceGenerator.create({
    updateForce: function (particle, duration) {
        var v0 = Vec3.clone(particle.velocity);
        var h0 = Vec3.clone(particle.position);
        var tsquare = duration * duration;
        var g = particle.gravity === undefined ? this.gravity : particle.gravity;
        // -1/2 * g * t^2 + v0 * t + h0
        var force = Vec3.create(0, -0.5 * g * tsquare); // -1/2*g*t^2
        Vec3.addScaledVector(force, force, v0, duration); // +v0*t 
        Vec3.add(force, force, h0);                     // +h0
        if (this.damping) {
            Vec3.scale(force, force, damping);
        }
        particle.addForce(force);
    }
});


function ForceRegistry() {
    "use strict";
    this.map = []
}
ForceRegistry.prototype = {
    add: function (o, fg) {
        this.map.push({object: o, fg: fg});
    },
    updateForces: function (duration) {
        this.map.forEach(function (r) {
            r.fg.updateForce(r.object, duration);
        });
    },
    remove: function (o, fg) {
        this.map = this.map.filter(function (r) {
            return !(r.object === o && r.fg === fg);
        });
    }
};


function GravityForceGenerator(gravity) {
    "use strict"
    this.gravity = gravity || 9.81;
}
GravityForceGenerator.prototype = ForceGenerator.create({
    updateForce: function (particle, duration) {
        "use strict";
        if (!particle.hasFiniteMass()) return;
        var force = Vec3.create(0, -(this.gravity * particle.mass), 0);
        Vec3.scale(force, force, duration);
        particle.addForce(force);
    }
});

function DragForceGenerator(k1, k2) {
    this.k1 = k1 !== undefined ? k1 : 1;
    this.k2 = k2 !== undefined ? k2 : 1;

}
DragForceGenerator.prototype = ForceGenerator.create({
    updateForce: function (particle, duration) {
        "use strict";
        var force = particle.velocity;
        var dragCoeff = Math.sqrt(force[0] * force[0] + force[1] * force[1] + force[2] * force[2]);
        dragCoeff = this.k1 * dragCoeff + this.k2 * dragCoeff * dragCoeff;
        Vec3.normalize(force, force);
        Vec3.scale(force, force, -dragCoeff);
        Vec3.scale(force, force, duration);
        particle.addForce(force);
    }
});


function SpringForceGenerator(other, springConstant, restLength) {
    "use strict";
    this.other = other;
    this.springConstant = springConstant !== undefined ? springConstant : 5;
    this.restLength = 0.5;
}
SpringForceGenerator.prototype = ForceGenerator.create({
    updateForce: function (particle, duration) {
        "use strict";
        var force = Vec3.create(particle.velocity);
        Vec3.sub(force, force, this.other.position);
        var mag = v3mag(force);
        mag = Math.abs(mag - this.restLength);
        mag *= this.springConstant;
        Vec3.normalize(force, force);
        Vec3.scale(force, force, -mag);
        particle.addForce(force);
    }
});


/*
 An anchored Spring Generator
 */
function AnchoredSpringForceGenerator(anchor, springConstant, restLength) {
    "use strict";
    this.anchor = anchor;
    this.springConstant = springConstant;
    this.restLength = restLength;
}
AnchoredSpringForceGenerator.prototype = ForceGenerator.create({
    updateForce: function (particle, duration) {
        "use strict";
        var force;
        force = Vec3.set(Vec3.create(), particle.position);
        Vec3.sub(force, force, this.anchor);
        var mag = Vec3.length(force);
        mag = Math.abs(mag - this.restLength);
        Vec3.scale(force, this.springConstant);
        Vec3.normalize(force, force);
        Vec3.scale(force, force, -mag);
        particle.addForce(force);
    }
});

/*
 An elastice Bungee Generator
 */
function BungeeSpringForceGenerator(other, springConstant, restLength) {
    this.other = other;
    this.springConstant = springConstant != undefined ? springConstant : 1;
    this.restLength = 2;
}
BungeeSpringForceGenerator.prototype = new ForceGenerator({
    updateForce: function (particle, duration) {
        "use strict";
        var force = Vec3.create(particle.position);
        Vec3.sub(force, force, other.position);
        var mag = Vec3.length(force);
        if (mag <= this.restLength) return;
        mag = this.springConstant * (this.restLength - mag);
        Vec3.normalize(force, force);
        Vec3.scale(force, force, -mag);
        particle.addForce(force);
    }
});

/*
 a buoyancy force generator
 */

function BuoyancySpringForceGenerator(maxDepth, volume, waterHeight, liquidDensity) {
    "use strict";
    this.maxDepth = maxDepth;
    this.volume = volume;
    this.waterHeight = waterHeight;
    this.liquidDensity = liquidDensity !== undefined ? liquidDensity : 1000.0;
}
BuoyancySpringForceGenerator.prototype = ForceGenerator.create({
    updateForce: function (particle, duration) {
        "use strict";
        var depth = particle.position[1]; // y
        if (depth >= this.waterHeight + this.maxDepth) return;
        var force = Vec3.create(0, 0, 0);
        if (depth <= this.waterHeight - this.maxDepth) {
            force[1] = this.liquidDensity * volume; // y
            particle.addForce(force);
            return;
        }
        force[1] = this.liquidDensity * volume * (depth - this.maxDepth - waterHeight) / 2 * maxDepth;
        particle.addForce(force);
    }
});

/*
 fake stiff springs
 */

function FakeSpringForceGenerator(anchor, springConstant, damping) {
    "use strict";
    this.damping = damping === undefined ? 1 : damping;
    this.anchor = anchor || Vec3.create();
    this.springConstant = springConstant === undefined ? 1 : springConstant;
}
FakeSpringForceGenerator.prototype = ForceGenerator.create({
    updateForce: function (particle, duration) {
        "use strict";
        var damping = this.damping
        if (!particle.hasFiniteMass()) return;
        var position = Vec3.create(particle.position);
        Vec3.sub(position, position, this.anchor);
        var gamma = 0.5 * Math.sqrt(4 * this.springConstant - damping * damping);
        if (gamma == 0) return;
        var c = Vec3.scale(Vec3.clone(position), this.damping / (gamma * 2));
        Vec3.addScaledVector(c, c, particle.velocity, 1 / gamma);
        Vec3.scale(position, position, Math.cos(gamma * duration));
        Vec3.addScaledVector(position, position, c, Math.sin(gamma * duration));
        var target = Vec3.create(position);
        Vec3.scale(target, target, Math.exp(0.5 * duration * damping));
        var accel = Vec3.sub(target, target, position);
        Vec3.scale(accel, accel, 1 / duration * duration);
        Vec3.sub(accel, accel, Vec3.scale(Vec3.create(), particle.velocity, duration));
        particle.addForce(Vec3.scale(accel, accel, particle.mass));
    }
});


function Explosion() {

}
Explosion.prototype = ForceGenerator.create({
    updateForce: function (body, duration) {

    }
})


function Aero() {

}
Aero.prototype = ForceGenerator.create({
    updateForce: function (body, duration) {

    }
})


function AeroControl(base, min, max, position, windspeed) {
    this.controlSetting = 0;
    this.base = base;
    this.minTensor = min;
    this.maxTensor = max;
    this.position = position;
    this.windspeed = windspeed;
}
AeroControl.prototype = ForceGenerator.create({
    getTensor: function () {
        var controlSetting = this.controlSetting;
        if (controlSetting <= -1) return this.minTensor;
        else if (controlSetting < 0) {
            return Mat3.linearInterpolate(this.minTensor, this.tensor, controlSetting + 1);
        } else if (controlSetting > 0) {
            return Mat3.linearInterpolate(this.tensor, this.maxTensor, controlSetting);
        }
        return tensor;
    },
    setControl: function (v) {
        this.controlSetting = v;
    },
    updateForce: function (body, duration) {
        var tensor = Mat3.create();
        Aero.updateForceFromTensor(body, duration, tensor);
    }
});


function BoundingBox(center, halfSize) {
    "use strict";
    this.center = center;
    this.halfSize = halfSize;
}


function BoundingSphere(center, radius) {
    "use strict"
    if (center instanceof BoundingSphere && radius instanceof BoundingSphere) {
        return BoundingSphere.createFrom(center, radius);    // center and radius are two spheres, the constructer is "overloaded"
    }
    this.center = center;
    this.radius = radius;
}
BoundingSphere.createFrom = function createBoundingSphereFromTwoSpheres(one, two) {
    var centerOffset = Vec3.sub(Vec3.create(), two.center, one.center);
    var distance = Vec3.squareMagnitude(centerOffset);
    var radiusDiff = two.radius - one.radius;
    // does larger enclose smaller?
    if (radiusDiff * radiusDiff >= distance) {
        if (one.radius > two.radius) {
            this.center = one.center;
            this.radius = one.radius;
        } else {
            this.center = two.center;
            this.radius = two.radius;
        }
    } else {
        // partially overlapping
        distance = Math.sqrt(distance);
        this.radius = (distance + one.radius + two.radius) * 0.5;
        this.center = one.center;
        if (distance > 0) {
            this.center += centerOffset * ((radius - one.radius) / distance);
        }
    }
};
BoundingSphere.prototype = {
    overlaps: function (other) {
        var distanceSquared = Vec3.squareMagnitude(
            Vec3.sub(Vec3.create(), this.center, other.center)
        );
        return distanceSquared < ((this.radius + other.radius) * (this.radius + other.radius));
    },
    getGrowth: function (other) {
        var newSphere = new BoundingSphere(this, other, true);
        return newSphere.radius * newSphere.radius - radius * radius;
    }
};


function GroundContact() {
    _add_(this, new Contact());
}
GroundContact.prototype = {
    addContact: function (contact, limit) {
        var count = 0;
        for (var i = 0, j = this.contacts.length; i < j; i++) {
            var p = this.contacts[i];
            var y = p.position[1];
            if (y < 0) {
                contact.contactNormal = Vec3.create(0, 1, 0); // Cyclone::Vector3::UP (1 y axis)
                contact.particle[0] = p;
                contact.particle[1] = 0.0; // Ground ist y = 0.0;
                contact.penetration = -y;
                contact.restitution = 0.2;
                ++count;
            }
            if (count >= limit) return count;
        }
        return count;
    }
};
_add_(GroundContact.prototype, Contact.prototype);


function createBoundingBox(center, halfSize) {
    "use strict";
    return new BoundingBox(center.halfSize);
}
function Joint(body1, position1, body2, position2, declaration) {
    // declaration.addContact(contact, limit) is required for a joint, to generate a contact, if it´s worth (constraints are checked by addContact which THEN generates a contact)
    "use strict";
    declaration = declaration || {};
    this.body = [body1, body2];
    this.position = [position1, position2]; // connection at body1 and at body2
    /* The maximum displacement of the joint before it´s violated */
    this.error = 0;
    _mixin_(this, declaration);
}
Joint.prototype.addContact = function (contact, limit) {
    var body = this.body;
    var error = this.error;
    var position = this.position;
    var a_pos_world = body[0].getPointInWorldSpace(position[0]);
    var b_pos_world = body[1].getPointInWorldSpace(position[1]);
    var a_to_b = Vec3.sub(Vec3.create(), a_pos_world, b_pos_world);
    var normal = Vec3.clone(a_to_b);
    Vec3.normalize(normal, normal);
    var length = Vec3.length(a_to_b);
    if (Math.abs(length) > error) {
        contact.body[0] = body[0]
        contact.body[1] = body[1]
        contact.contactNormal = Vec3.create();
        Vec3.add(contact.contactNormal, a_pos_world, b_pos_world);
        Vec3.scale(contact.contactNormal, contact.contactNormal, 0.5);
        contact.friction = 1;
        contact.restitution = 0;
        return 1;
    }
    return 0;
};
Joint.prototype.set = function (a, a_pos, b, b_pos, error) {
    this.error = error;
    this.position[0] = a_pos;
    this.position[1] = b_pos;
    this.body[0] = a;
    this.body[1] = b;
};

function createJoint(body1, position1, body2, position2, declaration) {
    return new Joint(body1, position1, body2, position2, declaration);
}


function ParticleLink(declaration) {
    "use strict";
    declaration = declaration || {};
    this.particles = [null, null]
    if (typeof declaration.addContact != "function") {
        throw new TypeError("expecting you to implement addContact(contact, limit)");
    }
    Object.keys(declaration).forEach(function (key) {
        this[key] = declaration[key];
    }, this);
}
ParticleLink.prototype = {
    currentLength: function () {
        var p = this.particles;
        var relDist = Vec3.sub(Vec3.create(), p[0].position, p[1].position);
        return Vec3.distance(relDist);
    }
};

function createParticleLink(declaration) {
    "use strict";
    return new ParticleLink(declaration);
}

function CableLink(maxLength, restitution) {
    "use strict";
    this.maxLength = maxLength;
    this.restitution = restitution;
}
CableLink.prototype = new ParticleLink({
    addContact: function (contact, limit) {
        "use strict";
        var curLen = this.currentLength();
        var maxLength = this.maxLength;
        if (curLen <= maxLength) return 0;
        contact.particles[0] = this.particles[0];
        contact.particles[1] = this.particles[1];
        var normal = Vec3.create();
        Vec3.sub(normal, particle[1].position, particle[0].position);
        contact.contactNormal = normal;
        contact.penetration = curLen - maxLength;
        contact.restitution = this.restitution;
        return 1;
    }
});


function RodLink(length) {
    "use strict";
    this.length = length;

}
RodLink.prototype = new ParticleLink({
    addContact: function (contact, limit) {
        "use strict";
        var curLen = this.currentLength();
        var length = this.length;
        if (curLen <= length) return 0;
        contact.particles[0] = this.particles[0];
        contact.particles[1] = this.particles[1];
        var normal = Vec3.create();
        Vec3.sub(normal, particle[1].position, particle[0].position);
        if (curLen > length) {
            contact.contactNormal = normal;
            contact.penetration = curLen - length;
        } else {
            Vec3.scale(contact.contactNormal, normal, -1);
            contact.penetration = length - curLen;
        }
        contact.restitution = 0;
        return 1;
    }
});


function ContactResolver(positionIterations, velocityIterations) {
    "use strict";
    this.positionIterations = 0;
    this.velocityIterations = 0;
    this.positionEpsilon = 0;
    this.velocityEpsilon = 0;
    this.velocityIterationsUsed = 0;
    this.positionIterationsUsed = 0;
    this.validSetting = false;
}
ContactResolver.prototype = {
    isValid: function () {
        "use strict";
        return (this.velocityIterations > 0 && this.positionIterations > 0 && this.positionEpsilon >= 0 && this.positionEpsilon >= 0);
    },
    setIterations: function (velIter, posIter) {
        "use strict";
        this.positionIterations = posIter;
        this.velocityIterations = velIter;
    },
    setEpsilon: function (velo, posi) {
        "use strict";
        this.velocityEpsilon = velo;
        this.positionEpsilon = posi;
    },
    resolveContacts: function (contacts, numContacts, duration) {
        if (numContacts == 0) return;
        if (!this.isValid()) return;
        this.prepareContacts(contacts, numContacts, duration);
        this.adjustPositions(contacts, numContacts, duration);
        this.adjustVelocities(contacts, numContacts, duration);
        console.log("contact resolver resolveContacts finished for duration = " + duration);
    },
    prepareContacts: function (contacts, numContacts, duration) {
        "use strict";
        this.contacts.forEach(function (contact) {
            contact.calulateInternals(duration);
        });
    },
    adjustVelocities: function (c, numContacts, duration) {
        "use strict";
        var velocityChange = [Vec3.create(), Vec3.create()];
        var rotationChange = [Vec3.create(), Vec3.create()];
        var deltaVel = Vec3.create();
        var index = numContacts;
        this.velocityIterationsUsed = 0;
        while (this.velocityIterationsUsed < this.velocityIterations) {
            var max = this.velocityEpsilon;
            for (var i = 0; i < numContacts; i++) {
                if (c[i].desiredDeltaVelocity > max) {
                    max = c[i].desiredDeltaVelocity;
                    index = i;
                }
            }
            if (index == numContacts) break;
            c[index].matchAwakeState();
            c[index].applyVelocityChange(velocityChange, rotationChange);
            for (var i = 0; i < numContacts; i++) {
                for (var b = 0; b < 2; b++) if (c[i].body[b]) {
                    for (var d = 0; d < 2; d++) {
                        if (c[i].body[b] == c[index].body[d]) {
                            Vec3.add(deltaVel, velocityChange[d], Vec3.cross(rotationChange[d], c[i].relativeContactPosition[b]));
                            Vec3.addScaledVector(c[i].contactVelocity, Mat34.transformTranspose(c[i].contactToWorld, deltaVel), b ? -1 : 1);
                        }
                    }
                }
            }
        }
        this.velocityIterationsUsed++;
    },
    adjustPositions: function (c, numContacts, duration) {
        "use strict";
        var i, index;
        var linearChange = [Vec3.create(), Vec3.create()];
        var angularChange = [Vec3.create(), Vec3.create()];
        var max;
        var deltaPosition = Vec3.create();
        this.positionIterationsUsed = 0;
        while (this.positionIterationsUsed < this.positionIterations) {
            max = this.positionEpsilon;
            index = numContacts;
            for (i = 0; i < numContacts; i++) {
                if (c[i].penetration > max) {
                    max = c[i].penetration;
                    index = i;
                }
            }
            if (index == numContacts) break;
            c[index].matchAwakeState();
            c[index].applyPositionChange(
                linearChange,
                angularChange,
                max
            );
            for (var i = 0; i < numContacts; i++) {
                for (var b = 0; b < 2; b++) if (c[i].body[b]) {
                    for (var d = 0; d < 2; d++) {
                        if (c[i].body[b] == c[index].body[d]) {
                            Vec3.add(deltaPosition, linearChange[d], Vec3.mul(angularChange[d], c[i].relativeContactPosition[b]));
                            c[i].penetration += Vec3.dot(deltaPosition, c[i].contactNormal) * b ? 1 : -1;
                        }
                    }
                }
            }
        }
    }
};


function ParticleContactResolver(iterations) {
    this.iterations = iterations;
    this.iterationsUsed = 0;
}
ParticleContactResolver.prototype = {
    __proto__: new ContactResolver(),
    resolveContacts: function (contactArray, numContacts, duration) {
        this.iterationsUsed = 0;
        while (this.iterationsUsed < this.iterations) {
            var max = 0;
            var maxIndex = numContacts;
            for (var i = 0; i < numContacts; i++) {
                var sepVel = contactArray[i].calculateSeparatingVelocity();
                if (sepVel < max) {
                    max = sepVel;
                    maxIndex = i;
                }
            }
            contactArray[maxIndex].resolve(duration);
            var move = Vec3.create(contactArray[maxIndex].particleMovement);
            for (i = 0; i < numContacts; i++) {
                if (contactArray[i].particle[0] == contactArray[maxIndex].particle[0]) {
                    contactArray[i].penetration -= move[0] * contactArray[i].contactNormal;

                } else if (contactArray[i].particle[0] == contactArray[maxIndex].particle[1]) {
                    contactArray[i].penetration -= move[1] * contactArray[i].contactNormal;
                }
                if (contactArray[i].particle[1]) {
                    if (contactArray[i].particle[1] == contactArray[maxIndex].particle[0]) {
                        contactArray[i].penetration += move[0] * contactArray[i].contactNormal;
                    } else if (contactArray[i].particle[0] == contactArray[maxIndex].particle[1]) {
                        contactArray[i].penetration += move[1] * contactArray[i].contactNormal;
                    }
                }
            }
            this.iterationsUsed += 1;
        }
    }
};


function createContact(c1, c2) {
    "use strict";
    return new Contact(c1, c2);
}

function Contact(c1, c2, f, r, p1, p2) {
    this.body = [c1, c2];
    this.friction = f || 0;
    this.restitution = r || 0;
    this.contactNormal = Vec3.create();
    this.contactPoint = Vec3.create();
    this.penetration = 0;
    this.contactToWorld = Mat34.create();
    this.contactVelocity = Vec3.create();
    this.desiredDeltaVelocity = 0;
    this.relativeContactPosition = [p1, p2];
}
Contact.prototype = {
    toString: function () {
        return "[object Contact: c-normal=" + Vec3.stringify(this.contactNormal) + ", c-point=" + Vec3.stringify(this.contactPoint) + ", penetration: " + this.penetration + "]";
    },
    setBodyData: function (one, two, friction, restitution) {
        "use strict";
        this.body[0] = one;
        this.body[0] = two;
        this.friction = friction;
        this.restitution = restitution;
    },
    matchAwakeState: function () {
        "use strict";
        var body = this.body;
        if (!this.body[1]) return;
        var body0awake = body[0].isAwake;
        var body1awake = body[1].isAwake;
        if (body0awake ^ body1awake) {
            if (body0awake) body[1].setAwake();
            else body[0].setAwake();
        }
    },
    swapBodies: function () {
        "use strict";
        Vec3.flip(this.contactNormal, this.contactNormal);
        var temp = this.body[0];
        this.body[0] = this.body[1];
        this.body[1] = temp;
    },
    calculateContactBasis: function calculateContactBasis() {	// used as contact.calculateContactBasis with this==contact	
        var contactTangent = [Vec3.create(), Vec3.create()];
        var abs = Math.abs;
        var sqrt = Math.sqrt;
        var contactNormal = this.contactNormal;
        var contactPoint = this.contactPoint;
        var s;
        // wether is z nearer to x or y axis
        if (abs(contactNormal[0]) > abs(contactNormal[1])) {
            // scaling factor to ensure normalization
            s = 1 / sqrt(contactNormal[2] * contactNormal[2] + contactNormal[0] * contactNormal[0]);
            // new x axis at right angles to worlds y axis
            contactTangent[0][0] = contactNormal[2] * s;
            contactTangent[0][1] = 0;
            contactTangent[0][2] = -contactNormal[0] * s;
            // new y axis at right angle to the new x and z axis
            contactTangent[1][0] = contactNormal[1] * contactTangent[0][0];
            contactTangent[1][1] = contactNormal[2] * contactTangent[0][0] - contactNormal[0] * contactTangent[0][2];
            contactTangent[1][2] = -contactNormal[1] * contactTangent[0][1];
        } else {
            s = 1 / sqrt(contactNormal[2] * contactNormal[2] + contactNormal[1] * contactNormal[1]);
            // new x
            contactTangent[0][0] = 0;
            contactTangent[0][1] = -contactNormal[2] * s;
            contactTangent[0][2] = contactNormal[1] * s;
            // new y
            contactTangent[1][0] = contactNormal[1] * contactTangent[0][2] - contactNormal[2] * contactTangent[0][1];
            contactTangent[1][1] = -contactNormal[0] * contactTangent[0][2];
            contactTangent[1][2] = contactNormal[0] * contactTangent[0][1];
        }
        this.contactToWorld = Mat3.create();
        Mat3.setComponents(this.contactToWorld,
            contactNormal,
            contactTangent[0],
            contactTangent[1]
        );
    },
    calculateInternals: function (duration) {
        "use strict";
        var body = this.body;
        var contactPoint = this.contactPoint;
        var contactNormal = this.contactNormal;
        if (!body[0]) this.swapBodies();
        if (!body[0]) throw new TypeError("failed to assert body[0]");
        this.calculateContactBasis();
        this.relativeContactPosition[0] = Vec3.sub(this.relativeContactPosition[0], contactPoint, body[0].position);
        if (body[1]) {
            this.relativeContactPosition[1] = Vec3.sub(this.relativeContactPosition[1], contactPoint, body[1].position);
        }
        var contactVelocity = this.calculateLocalVelocity(0, duration);
        if (body[1]) {
            contactVelocity -= this.calculateLocalVelocity(1, duration);
        }
        this.calculateDesiredDeltaVelocity(duration);
    },
    applyVelocityChange: function (duration) {
        "use strict";
        var body = this.body;
        var contactToWorld = this.contactToWorld;
        var iit = [Mat3.create(), Mat3.create()];
        body[0].getInverseInertiaTensorWorld(iit[0]);
        if (body[1]) body[1].getInverseInertiaTensorWorld(iit[1]);
        var impulseContact;
        if (friction === 0) {
            impulseContact = this.calculateFrictionlessImpulse(iit);
        } else {
            impulseContact = this.calculateFrictionImpulse(iit);
        }
        var impulse = Mat3.transform(contactToWorld, impulseContact);
        var impulsiveTorque = Vec3.cross(this.relativeContactPosition[0], impulse)
        this.rotationChange[0] = Mat3.transform(inverseInertiaTensor[0], impulsiveTorque);
        Vec3.clear(this.velocityChange[0]);
        Vec3.addScaledVector(this.velocityChange[0], this.velocityChange[0], impulse, body[0].inverseMass);
        body[0].addVelocity(velocityChange[0]);
        body[0].addRotation(rotationChange[0]);
        if (body[1]) {
            var impulsiveTorque = Vec3.cross(impulse, this.relativeContactPosition[1]);
            this.rotationChange[1] = Mat3.transform(inverseInertiaTensor[1], impulsiveTorque);
            Vec3.clear(this.velocityChange[1]);
            Vec3.addScaledVector(this.velocityChange[1], this.velocityChange[1], impulse, -body[1].inverseMass);
            body[1].addVelocity(velocityChange[1]);
            body[1].addRotation(rotationChange[1]);
        }

    },


    calculateLocalVelocity: function (bodyIndex, duration) {
        "use strict";
        var thisBody = this.body[bodyIndex];
        var velocity = Vec3.cross(thisBody.getRotation(), this.relativeContactPosition[bodyIndex]);
        Vec3.add(velocity, velocity, thisBody.velocity);
        this.contactVelocity = Mat34.transformTranspose(this.contactToWorld, velocity);
        var accVelocity = Vec3.scale(Vec3.create(), thisBody.getLastFrameAcceleration(), duration);
        accVelocity = Mat34.transformTranspose(contactToWorld, accVelocity);
        accVelocity.x = 0;
        contactVelocity += accVelocity;
        return this.contactVelocity;
    },

    calculateDesiredDeltaVelocity: function () {
        "use strict";

        var body = this.body;
        var velocityLimit = 0.25;
        var velocityFromAcc = 0;

        if (body[0].getAwake()) {
            velocityFromAcc = body[0].getLastFrameAcceleration();
            Vec3.scale(velocityFromAcc, velocityFromAcc, duration);
            Vec3.multiply(velocityFromAcc, velocityFromAcc, contactNormal);

        }

        if (body[1] && body[1].getAwake()) {

            Vec3.add(velocityFromAcc, velocityFromAcc,
                body[1].getLastFrameAcceleration());
            Vec3.scale(velocityFromAcc, velocityFromAcc, duration);
            Vec3.multiply(velocityFromAcc, velocityFromAcc, contactNormal);

        }

        // If the velocity is very slow, limit the restitution
        var thisRestitution = +this.restitution;
        if (Math.abs(contactVelocity[0]) < velocityLimit) {
            thisRestitution = 0;
        }

        // Combine the bounce velocity with the removed
        // acceleration velocity.
        desiredDeltaVelocity =

            -contactVelocity[0]
            - thisRestitution * (contactVelocity[0] - velocityFromAcc);


    },

    calculateFrictionlessImpulse: function (inverseInertiaTensor) {
        "use strict";
        var impulseContact;

        // Build a vector that shows the change in velocity in
        // world space for a unit impulse in the direction of the contact
        // normal.
        var deltaVelWorld = Vec3.cross(this.relativeContactPosition[0], this.contactNormal);
        deltaVelWorld = Mat3.transform(inverseInertiaTensor[0], deltaVelWorld);
        deltaVelWorld = Vec3.cross(deltaVelWorld, relativeContactPosition[0]);

        // Work out the change in velocity in contact coordiantes.
        var deltaVelocity = Vec3.scale(deltaVelWorld, deltaVelWorld, contactNormal);

        // Add the linear component of velocity change
        Vec3.addScalar(deltaVelocity, deltaVelocity, body[0].inverseMass);


        if (body[1]) {

            var deltaVelWorld = Vec3.cross(this.relativeContactPosition[1], this.contactNormal);
            deltaVelWorld = Mat3.transform(inverseInertiaTensor[1], deltaVelWorld);
            deltaVelWorld = Vec3.cross(deltaVelWorld, this.relativeContactPosition[1]);
            Vec3.addScaledVector(deltaVelocity, deltaVelocity, deltaVelWorld, this.contactNormal);
            Vec3.addScalar(deltaVelocity, deltaVelocity, body[1].inverseMass);
        }

        // Calculate the required size of the impulse
        impulseContact[0] = desiredDeltaVelocity / deltaVelocity;
        impulseContact[1] = 0;
        impulseContact[2] = 0;
        return impulseContact;

    },

    calculateFrictionImpulse: function (inverseInertiaTensor) {
        "use strict";

        var impulseContact = Vec3.create();
        var inverseMass = this.body[0].inverseMass;
        var impulseToTorque = Mat3.create();
        Mat3.setSkewSymmetric(impulseToTorque, this.relativeContactPosition[0]);
        // Build the matrix to convert contact impulse to change in velocity
        // in world coordinates.
        var deltaVelWorld = Mat3.clone(impulseToTorque);
        Mat3.multiply(deltaVelWorld, deltaVelWorld, inverseInertiaTensor[0]);
        Mat3.multiply(deltaVelWorld, deltaVelWorld, impulseToTorque);
        Mat3.scale(deltaVelWorld, deltaVelWorld, -1);


        if (body[1]) {
            Mat3.setSkewSymmetric(impulseToTorque, this.relativeContactPosition[1]);
            var deltaVelWorld2 = Mat3.clone(impulseToTorque);
            Mat3.multiply(deltaVelWorld2, deltaVelWorld2, inverseInertiaTensor[1]);
            Mat3.multiply(deltaVelWorld2, deltaVelWorld2, impulseToTorque);
            Mat3.scale(deltaVelWorld2, deltaVelWorld2, -1);
            Mat3.add(deltaVelWorld, deltaVelWorld2);
            inverseMass += this.body[1].inverseMass;
        }

        Mat3.transpose(deltaVelocity, contactToWorld);


        Mat3.multiply(deltaVelocity, deltaVelocity, deltaVelWorld)
        Mat3.multiply(deltaVelocity, deltaVelocity, contactToWorld)

        // Add in the linear velocity change
        deltaVelocity[0] += inverseMass;
        deltaVelocity[1] += inverseMass;
        deltaVelocity[2] += inverseMass;

        // Invert to get the impulse needed per unit velocity
        var impulseMatrix = Mat3.invert(deltaVelocity);


        // Find the target velocities to kill
        var velKill = Vec3.create(desiredDeltaVelocity,
            -contactVelocity[1],
            -contactVelocity[2]);

        // Find the impulse to kill target velocities
        impulseContact = Mat3.transform(impulseMatrix, velKill);

        // Check for exceeding friction
        var planarImpulse = Math.sqrt(
            impulseContact[1] * impulseContact[1] +
            impulseContact[2] * impulseContact[2]
        );

        if (planarImpulse > impulseContact[0] * friction) {
            // We need to use dynamic friction
            impulseContact[1] /= planarImpulse;
            impulseContact[2] /= planarImpulse;

            impulseContact[0] = deltaVelocity[0] +
            deltaVelocity[1] * friction * impulseContact[1] +
            deltaVelocity[2] * friction * impulseContact[2];
            impulseContact[0] = desiredDeltaVelocity / impulseContact[0];
            impulseContact[1] *= friction * impulseContact[0];
            impulseContact[2] *= friction * impulseContact[0];
        }
        return impulseContact;

    },

    applyPositionChange: function (linearChange, angularChange, penetration) {
        "use strict";
        var angularLimit = 0.2;
        var angularMove = [0, 0];
        var linearMove = [0, 0];
        var totalInertia = 0;
        var linearInertia = [0, 0];
        var angularInerta = [0, 0];

        // We need to work out the inertia of each object in the direction
        // of the contact normal, due to angular inertia only.
        for (var i = 0; i < 2; i++) if (body[i]) {
            var inverseInertiaTensor = Mat3.create();
            body[i].getInverseInertiaTensorWorld(inverseInertiaTensor);

            // Use the same procedure as for calculating frictionless
            // velocity change to work out the angular inertia.
            var angularInertiaWorld = Vec3.cross(
                this.relativeContactPosition[i], this.contactNormal);
            angularInertiaWorld =
                Mat3.transform(inverseInertiaTensor, angularInertiaWorld);
            angularInertiaWorld =
                Vec3.cross(angularInertiaWorld, this.relativeContactPosition[i]);
            Vec3.mul(angularInertia[i], angularInertiaWorld, contactNormal);

            // The linear component is simply the inverse mass
            linearInertia[i] = body[i].inverseMass;

            // Keep track of the total inertia from all components
            totalInertia += linearInertia[i] + angularInertia[i];

            // We break the loop here so that the totalInertia value is
            // completely calculated (by both iterations) before
            // continuing.
        }

        // Loop through again calculating and applying the changes
        for (var i = 0; i < 2; i++) if (body[i]) {
            // The linear and angular movements required are in proportion to
            // the two inverse inertias.
            var sign = (i == 0) ? 1 : -1;
            angularMove[i] =
                sign * penetration * (angularInertia[i] / totalInertia);
            linearMove[i] =
                sign * penetration * (linearInertia[i] / totalInertia);

            // To avoid angular projections that are too great (when mass is large
            // but inertia tensor is small) limit the angular move.
            var projection = Vec3.clone(this.relativeContactPosition[i]);
            Vec3.addScaledVector(projection,
                contactNormal,
                Vec3.dot(-this.relativeContactPosition[i], contactNormal)
            );

            // Use the small angle approximation for the sine of the angle (i.e.
            // the magnitude would be sine(angularLimit) * projection.magnitude
            // but we approximate sine(angularLimit) to angularLimit).
            var maxMagnitude = angularLimit * projection.magnitude();

            if (angularMove[i] < -maxMagnitude) {
                var totalMove = angularMove[i] + linearMove[i];
                angularMove[i] = -maxMagnitude;
                linearMove[i] = totalMove - angularMove[i];
            }
            else if (angularMove[i] > maxMagnitude) {
                var totalMove = angularMove[i] + linearMove[i];
                angularMove[i] = maxMagnitude;
                linearMove[i] = totalMove - angularMove[i];
            }

            // We have the linear amount of movement required by turning
            // the rigid body (in angularMove[i]). We now need to
            // calculate the desired rotation to achieve that.
            if (angularMove[i] == 0) {
                // Easy case - no angular movement means no rotation.
                Vec3.clear(angularChange[i]);
            }
            else {
                // Work out the direction we'd like to rotate in.
                var targetAngularDirection = Vec3.cross(this.relativeContactPosition[i], this.contactNormal);

                var inverseInertiaTensor = Mat3.create();
                body[i].getInverseInertiaTensorWorld(inverseInertiaTensor);

                // Work out the direction we'd need to rotate to achieve that
                angularChange[i] =
                    Vec3.addScaledVector(angularChange[i], angularChange[i], Mat3.transfom(inverseInertiaTensor, targetAngularDirection),
                        (angularMove[i] / angularInertia[i]));
            }
            // Velocity change is easier - it is just the linear movement
            // along the contact normal.
            linearChange[i] = contactNormal * linearMove[i];

            // Now we can start to apply the values we've calculated.
            // Apply the linear movement
            var pos = Vec3.create();
            body[i].getPosition(pos);
            Vec3.addScaledVector(pos, contactNormal, linearMove[i]);
            body[i].setPosition(pos);
            // And the change in orientation
            var q = Quaternion.create();
            body[i].getOrientation(q);
            Quaternion.addScaledVector(q, angularChange[i], 1.0);
            body[i].setOrientation(q);
            if (!body[i].getAwake()) body[i].calculateDerivedData();
        }

    },

    applyImpulse: function (impulse, body, velocityChange, rotationChange) {
        // Empty. not in the book, only defined in the source header, nowhere executed..? remove.
    }
};


function PotentialContact(a, b) {
    return new Contact(a, b);
}

function ParticleContact(p1, p2) {
    "use strict";
    this.particles = [p1, p2];
    this.restitution = 1;
    this.contactNormal = Vec3.create();
    this.contactPoint = Vec3.create();
    this.penetration = 0;
    this.particleMovement = [Vec3.create(), Vec3.create()];
}
ParticleContact.prototype = {
    resolve: function (duration) {
        "use strict";
        this.resolveVelocity(duration);
        this.resolveInterpenetration(duration);
    },
    resolveVelocity: function (duration) {
        "use strict";
        var restitution = this.restitution;
        var sepVelo = this.calculateSeparatingVelocity();
        if (sepVelo > 0) return;
        var newSepVelo = -sepVelo * restitution;
        var deltaVelo = newSepVelo - sepVelo;
        var totalInverseMass = this.particles[0].inverseMass;
        if (this.particles[1]) totalInverseMass += this.particles[1].inverseMass;
        if (totalInverseMass < 0) return;
        var impulse = deltaVelocity / totalInverseMass;
        var impulsePerMass = Vec3.create();
        Vec3.scale(impulsePerMass, this.contactNormal, impulse);
        Vec3.addScaledVector(this.particles[0].velocity, this.particles[0].velocity, impulsePerMass, this.particles[1].inverseMass);
        if (this.particles[1]) {
            Vec3.addScaledVector(this.particles[1].velocity, this.particles[1].velocity, impulsePerMass, this.particles[1].inverseMass);
        }
    },
    calculateSeparatingVelocity: function () {
        "use strict";
        var relativeVelo = Vec3.set(Vec3.create(), this.particles[0].velocity);
        if (this.particles[1]) Vec3.sub(relativeVelo, relativeVelo, this.particles[1].velocity);
        return Vec3.dot(relativeVelo, contactNormal);
    },
    resolveInterpenetration: function (duration) {
        "use strict";
        var particle = this.particles;
        var penetration = this.penetration;
        if (penetration <= 0) return;
        var totalInverseMass = particle[0].inverseMass;
        if (particle[1]) totalInverseMass += particle[1].inverseMass;
        if (totalInverseMass <= 0) return;
        var movePerIMass = Vec3.create();
        Vec3.add(movePerIMass, movePerIMass, this.contactNormal);
        Vec3.scale(movePerIMass, movePerIMass, -penetration / totalInverseMass);
        var position = Vec3.create();
        Vec3.addScaledVector(position, particle[0].position, movePerIMass, particle[0].inverseMass);
        Vec3.scale(this.particleMovement[0], movePerIMass, particle[0].inverseMass);
        if (particle[1]) {
            Vec3.scale(this.particleMovement[1], movePerIMass, particle[1].inverseMass);
        } else {
            Vec3.clear(this.particleMovement[1]);
        }

        Vec3.set(particle[0].position, position);
        if (particle[1]) {
            position = Vec3.create();
            Vec3.addScaledVector(position, particle[1].position, movePerIMass, particle[1].inverseMass);
            Vec3.set(particle[1].position, position);
        }
    }
};


function assignKey(obj) {
    return function (key) {
        "use strict";
        this[key] = obj[key];
    }
}
function assignNewKey(obj) {
    return function (key) {
        "use strict";
        if (this[key] == undefined) this[key] = obj[key];
    }
}
function _add_(target, source) {
    Object.keys(source).forEach(assignNewKey(source), target);
    return target;
}
function _mixin_(target, source) {
    Object.keys(source).forEach(assignKey(source), target);
    return target;
}

var IntersectionTests = {
    transformToAxis: function (box, axis) {
        return box.halfSize[0] * Math.abs(axis * box.getAxis(0)) +
        box.halfSize[1] * Math.abs(axis * box.getAxis(1)) +
        box.halfSize[2] * Math.abs(axis * box.getAxis(2));
    },
    overlapOnAxis: function (one, two, axis, toCentre) {
        var oneProject = this.transformToAxis(one, axis);
        var twoProject = this.transformToAxis(two, axis);
        var distance = Math.abs(Vec3.dot(toCentre, axis));
        return (distance < oneProject + twoProject);
    },
    boxAndBox: function (one, two) {
        "use strict";
        // Find the vector between the two centres
        var toCentre = Vec3.sub(Vec3.create(), two.getAxis(3), one.getAxis(3));
        var me = this;
        var TEST_OVERLAP = function (axis) {
            return me.overlapOnAxis(one, two, axis, toCentre)
        };
        return (

        TEST_OVERLAP(one.getAxis(0)) &&
        TEST_OVERLAP(one.getAxis(1)) &&
        TEST_OVERLAP(one.getAxis(2)) &&
        TEST_OVERLAP(two.getAxis(0)) &&
        TEST_OVERLAP(two.getAxis(1)) &&
        TEST_OVERLAP(two.getAxis(2)) &&
        TEST_OVERLAP(Vec3.cross(one.getAxis(0), two.getAxis(0))) &&
        TEST_OVERLAP(Vec3.cross(one.getAxis(0), two.getAxis(1))) &&
        TEST_OVERLAP(Vec3.cross(one.getAxis(0), two.getAxis(2))) &&
        TEST_OVERLAP(Vec3.cross(one.getAxis(1), two.getAxis(0))) &&
        TEST_OVERLAP(Vec3.cross(one.getAxis(1), two.getAxis(1))) &&
        TEST_OVERLAP(Vec3.cross(one.getAxis(1), two.getAxis(2))) &&
        TEST_OVERLAP(Vec3.cross(one.getAxis(2), two.getAxis(0))) &&
        TEST_OVERLAP(Vec3.cross(one.getAxis(2), two.getAxis(1))) &&
        TEST_OVERLAP(Vec3.cross(one.getAxis(2), two.getAxis(2)))
        );
    },

    boxAndHalfSpace: function (box, plane) {
        "use strict";
        var projectedRadius = CollisionDetector.transformToAxis(box, plane.direction);
        var boxDistance = Vec3.create();
        Vec3.sub(boxDistance, box.getAxis(3), projectedRadius);
        Vec3.scale(boxDistance, plane.direction, projectedRadius);
        return boxDistance <= plane.offset;
    },

    sphereAndHalfSpace: function () {
        "use strict";
        var ballDistance = Vec3.create();
        Vec3.sub(ballDistance, sphere.getAxis(3), sphere.radius);
        Vec3.scale(ballDistance, plane.direction, ballDistance);
        return ballDistance <= plane.offset;
    },

    sphereAndSphere: function () {
        "use strict";
        var midline = Vec3.sub(Vec3.create(), one.getAxis(3), two.getAxis(3));
        return Vec3.squareMagnitude(midline) < ((one.radius + two.radius) * (one.radius + two.radius));
    }
};

var CollisionDetector = {

    sphereAndSphere: function (one, two, data) {

        if (data.contactsLeft <= 0) return 0;
        var positionOne = one.getAxis(3);
        var positionTwo = two.getAxis(3);
        var midLine = Vec3.sub(Vec3.create(), positionOne, positionTwo);
        var size = Vec3.length(midLine);
        if (size < 0.0 || size >= one.radius + two.radius) return 0;
        var normal = Vec3.scale(Vec3.create(), midLine, 1.0 / size);
        var contact = data.contacts;
        contact.contactNormal = normal;
        var scaledMidline = Vec3.scale(Vec3.create(), midLine, 0.5);
        contact.contactPoint = Vec3.add(Vec3.create(), positionOne, scaledMidline);
        contact.penetration = (one.radius + two.radius - size);
        contact.body[0] = one.body;
        contact.body[1] = two.body;
        contact.restitution = data.restitution;
        contact.friction = data.friction;
        return 1;
    },

    sphereAndHalfSpace: function (sphere, plane, data) {
        if (data.contactsLeft <= 0) return 0;
        var position = sphere.getAxis(3);
        var ballDistance = Vec3.dot(plane.direction, position) - sphere.radius - plane.offset;
        if (ballDistance >= 0) return 0;
        var contact = data.contacts;
        contact.contactNormal = plane.direction;
        contact.penetration = -ballDistance;
        contact.contactPoint = Vec3.sub(Vec3.create(), position, Vec3.scale(Vec3.create(), plane.direction, ballDistance + sphere.radius));
        contact.body[0] = sphere.body;
        contact.body[1] = null;
        contact.restitution = data.restitution;
        contact.friction = friction;
        return 1;
    },

    sphereAndTruePlane: function (sphere, plane, data) {
        if (data.contactsLeft <= 0) return 0;
        var position = sphere.getAxis(3);
        var centerDistance = Vec3.dot(plane.direction, position) - plane.offset; // d = p dot L - l
        if (centerDistance * centerDistance > sphere.radius * sphere.radius) {
            return 0;
        }
        var normal = Vec3.clone(plane.direction);
        var penetration = -centerDistance;
        if (centerDistance < 0) {
            Vec3.flip(normal);
            penetration = -penetration;
        }
        penetration += sphere.radius;
        var contact = data.contacts;
        contact.contactNormal = normal;
        contact.penetration = penetration;
        contact.contactPoint = Vec3.sub(Vec3.create(), position, Vec3.scale(Vec3.create(), plane.direction, centerDistance));
        contact.body[0] = sphere.body;
        contact.body[1] = null;
        contact.restitution = data.restitution;
        contact.friction = data.friction;
        return 1;
    },
    boxAndSphere: function (box, sphere, data) {
        var center = sphere.getAxis(3);
        var relCenter = Mat3.transformInverse(box.transform, center);
        var abs = Math.abs;
        if (abs(relCenter[0]) - sphere.radius > box.halfSize[0] ||
            abs(relCenter[1]) - sphere.radius > box.halfSize[1] ||
            abs(relCenter[2]) - sphere.radius > box.halfSize[2]) {
            return 0;
        }
        var closestPt = Vec3.create(0, 0, 0);
        var dist;
        dist = relCenter[0];
        if (dist > box.halfSize[0]) dist = box.halfSize[0];
        if (dist < -box.halfSize[0]) dist = -box.halfSize[0];
        closestPt[0] = dist;
        dist = relCenter[1];
        if (dist > box.halfSize[1]) dist = box.halfSize[1];
        if (dist < -box.halfSize[1]) dist = -box.halfSize[1];
        closestPt[1] = dist;
        dist = relCenter[2];
        if (dist > box.halfSize[2]) dist = box.halfSize[2];
        if (dist < -box.halfSize[2]) dist = -box.halfSize[2];
        closestPt[2] = dist;
        dist = Vec3.squareMagnitude(Vec3.sub(Vec3.create(), closestPt, relCenter));
        if (dist > sphere.radius * sphere.radius) return 0;
        var closestPtWorld = Mat4.transform(box.transform, closestPt);
        var contact = data.contacts;
        contact.contactNormal = Vec3.sub(Vec3.create(), center, closestPtWorld);
        Vec3.normalize(contact.contactNormal, contact.contactNormal);
        contact.contactPoint = closestPtWorld;
        contact.penetration = sphere.radius - Math.sqrt(dist);
        contact.body[0] = box.body;
        contact.body[1] = sphere.body;
        contact.restitution = data.restitution;
        contact.friction = data.friction;
        return 1;
    },
    transformToAxis: function (box, axis) {
        var abs = Math.abs;
        return box.halfSize[0] * abs(Vec3.dot(axis, box.getAxis(0))) +
        box.halfSize[1] * abs(Vec3.dot(axis, box.getAxis(1))) +
        box.halfSize[2] * abs(Vec3.dot(axis, box.getAxis(2)));
    },
    overlapOnAxis: function (boxOne, boxTwo, axis) {
        var oneProject = transformToAxis(boxOne, axis);
        var twoProject = transformToAxis(boxTwo, axis);
        var toCenter = Vec3.sub(Vec3.create(), boxTwo.getAxis(3) - boxOne.getAxis(3));
        var distance = Math.abs(Vec3.dot(toCenter, axis));
        return distance < oneProject + twoProject;
    },
    boxAndPoint: function (box, point, data) {
        var relPt = Mat4.transformInverse(box.transform, point);
        var normal;
        var min_depth = box.halfSize[0] - Math.abs(relPt[0]);
        if (min_depth < 0) return 0;
        Vec3.scale(normal, box.getAxis(0), relPt[0] < 0 ? -1 : 1);
        var depth = box.halfSize[1] - Math.abs(relPt[1]);
        if (depth < 0) return 0;
        else if (depth < min_depth) {
            min_depth = depth;
            Vec3.scale(normal, box.getAxis(1), relPt[1] < 0 ? -1 : 1);
        }
        depth = box.halfSize[2] - Math.abs(relPt[2]);
        if (depth < 0) return 0;
        else if (depth < min_depth) {
            min_depth = depth;
            Vec3.scale(normal, box.getAxis(2), relPt[2] < 0 ? -1 : 1);
        }
        var contact = data.contacts;
        contact.contactNormal = normal;
        contact.contactPoint = point;
        contact.penetration = min_depth;
        contact.body[0] = box.body;
        contact.body[1] = null;
        contact.restitution = data.restitution;
        contact.friction = data.friction;
        return 1;
    }
};


function ContactPrimitive(body, offset) {
    this.body = body;   // RigidBody
    this.offset = offset; // Matrix34
}
ContactPrimitive.prototype.getTransform = function () {
    "use strict";
    return Mat34.multiply(Mat34.create(), this.body.getTransform(), this.offset);   // transform world
};


function Plane(normal, offset) {
    this.normal = normal;
    this.offset = offset;
}
Plane.prototype = new ContactPrimitive();


function Sphere(radius, position) {
    this.radius = radius;
    this.position = position;
}
Sphere.prototype = new ContactPrimitive();


function Box(halfSize) {
    this.halfSize = halfSize;
    this.offset = Mat34.create();
}
Box.prototype = new ContactPrimitive();

Box.prototype.createVertices = function () {
    var halfSize = this.halfSize;
    var vertices = [
        Vec3.create(-halfSize[0], -halfSize[1], -halfSize[2]),
        Vec3.create(-halfSize[0], -halfSize[1], +halfSize[2]),
        Vec3.create(-halfSize[0], +halfSize[1], -halfSize[2]),
        Vec3.create(-halfSize[0], +halfSize[1], +halfSize[2]),
        Vec3.create(halfSize[0], -halfSize[1], -halfSize[2]),
        Vec3.create(halfSize[0], -halfSize[1], +halfSize[2]),
        Vec3.create(halfSize[0], +halfSize[1], -halfSize[2]),
        Vec3.create(halfSize[0], +halfSize[1], +halfSize[2]),
    ];
    this.vertices = vertices.map(function (vertex) {
        return Mat34.transform(this.offset, vertex);
    });
};

function generateVertexContact(vertex, plane, data, contact) {
    var vertexDistance = Vec3.dot(vertex, plane.direction);
    if (vertexDistance <= plane.offset + data.tolerance) {
        contact.contactPoint = Vec3.clone(plane.direction);
        Vec3.scale(contact.contactPoint, contact.contactPoint, vertexDistance - plane.offset);
        Vec3.add(contact.contactPoint, contact.contactPoint, vertex);
        contact.contactNormal = plane.direction;
        contact.penetration = plane.offset - vertexDistance;
    }
}

function CollisionData(contacts, contactsLeft) {
    "use strict";
    this.contactArray = contacts;
    this.contacts = contacts;
    this.contactsLeft = contactsLeft != undefined ? contactsLeft : PHYSICS_MAX_CONTACTS;
    this.contactCount = 0;
    this.friction = 0;
    this.restitution = 0;
    this.tolerance = 0;
}
CollisionData.MAX_CONTACTS = 100;
CollisionData.prototype = {
    addContacts: function (count) {
        "use strict";
        this.contactsCount += count;
        this.contactsLeft -= count;
        this.contacts = this.contactArray[this.contactsCount - count - 1];
    },
    hasMoreContacts: function () {
        "use strict";
        return this.contactsLeft > 0;
    },
    reset: function () {
        "use strict";
        this.contactsLeft = this.maxContacts;
        this.contactCount = 0;
        this.contacts = this.contactArray;
    }
};
function createCollisionData(contacts, contactsLeft) {
    return new CollisionData(contacts, contactsLeft)
}

function BHVNode(parent, body, volume) {
    this.children = [null, null];
    this.body = body;
    this.volume = volume;
    this.parent = parent;
}
BHVNode.prototype = {
    isLeaf: function () {
        return this.body != null;
    },
    getPotentialContacts: function (contacts, limit) {
        if (this.isLeaf() || limit == 0) return;
        return this.children[0].getPotentialContactsWith(
            children[1], contacts, limit
        );
    },
    getPotentialContactsWith: function (other, contacts, limit) {
        if (!overlaps(other) || limit == 0) return 0;
        if (this.isLeaf() && other.isLeaf()) {
            contacts.body[0] = body;
            contacts.body[1] = other.body;
        }
        if (other.isLeaf() || (!this.isLeaf() && this.volume.getSize() >= other.volume.getSize())) {
            var count = this.children[0].getPotentialContactsWith(
                other, contacts, limit
            );
            if (limit > count) {
                return count + this.children[1].getPotentialContactsWith(
                    other, contacts + count, limit - count
                );
            }
            return count;
        } else {

            count = this.getPotentialContactsWith(
                other.children[0], contacts, limit
            );
            if (limit > count) {
                return count + this.getPotentialContactsWith(
                    other.children[1], contacts, limit - count
                );
            } else {
                return count;
            }
        }
    },
    recalculateBoundingVolume: function () {
        "use strict";
        var parent = this.parent;
        var volume = this.volume;
        var children = this.children;

        this.volume = volume = volume.createFrom(children[0].volume, children[1].volume);


        if (parent) parent.recalculateBoundingVolume(true);
    },
    insert: function (newBody, newVolume) {
        if (this.isLeaf()) {
            this.children[0] = new BHVNode(this, volume, body);
            this.children[1] = new BHVNode(this, newVolume, newBody);
            this.body = null;
            this.recalculateBoundingVolume();
        } else {
            if (this.children[0].volume.getGrowth(newVolume) <
                this.children[1].volume.getGrowth(newVolume)) {
                this.children[0].insert(newBody, newVolume);
            } else {
                this.children[1].insert(newBody, newVolume);
            }
        }
    },
    destroy: function () {
        if (this.parent) {
            var sibling;
            if (this.parent.children[0] == this) sibling = this.parent.children[1];
            else sibling = this.parent.children[0];
            this.parent.volume = sibling.volume;
            this.parent.body = sibling.body;
            this.parent.children[0] = sibling.children[0];
            this.parent.children[1] = sibling.children[1];
            sibling.parent = null;
            sibling.body = null;
            sibling.children[0] = null;
            sibling.children[1] = null;
            sibling.destroy();
            sibling = null;
            this.parent.recalculateBoundingVolume();
        }
        if (this.children[0]) {
            this.children[0].parent = null;
            this.children[0].destroy();
            this.children[0] = null;
        }
        if (this.children[1]) {
            this.children[1].parent = null;
            this.children[1].destroy();
            this.children[1] = null;
        }
    }
};

function BSP(plane, front, back) {
    "use strict";
    this.plane = plane;
    this.front = front;
    this.back = back;
};
BSP.NODE = 1;
BSP.OBJECTSET = 2;
BSP.BOUNDINGVOLUME = 3;
BSP.prototype = {
    find: function (location) {
        var stack = [];
    }
};


function BSPChild(type, value) {
    "use strict";
    if (type == BSP.NODE) {
        this.node = value;
    } else if (type == BSP.OBJECTSET) {
        this.objects = value;
    } else if (type == BSP.BOUNDINGVOLUME) {
        this.objects = value;
    }
    this.type = type;
}


function createBSPObjectSet() {
    "use strict";
    return [];
}


function QuadTree(parent, origin, children) {
    "use strict";
    this.parent = null;
    this.origin = origin;
    this.children = new Array(4);
}
QuadTree.prototype = {
    getField: function (vec) {
        "use strict";

        if (this.origin[0] < vec[0]) {
            // x pos

        } else {
            // x neg
        }
        if (this.origin[2] < vec[2]) {
            E
            // z pos

        } else {
            // z neg

        }
    },
    insert: function () {
        "use strict";

    },
    remove: function () {
        "use strict";

    }
};

function OctTree() {
    "use strict";
    this.position = Vec3.create();
    this.children = new Array(8);
}
OctTree.prototype = {
    getChildIndex: function (object) {
        "use strict";
        var index = 0;
        var position = this.position;
        if (object[0] > position[0]) index += 1;
        if (object[1] > position[1]) index += 2;
        if (object[2] > position[2]) index += 4;
        return index;
    }
};


function Grid() {
    "use strict";
    this.xExtent = 0;
    this.zExtent = 0;
    this.locations = [];
    this.origin = Vec3.create();
    this.oneOverCellSize = Vec3.create();
}

Grid.prototype = {
    getLocationIndex: function (object) {
        "use strict";
        var square = Vec3.create();
        Vec.mul(square, object, oneOverCellSize);
        return square[0] + xExtent * square[2] + zExtent;
    }
}

function DecisionTree() {
    "use strict";
}

DecisionTree.prototype = {
    insert: function () {
    },
    remove: function () {
    },
    walk: function () {
    }
};

function createDecision(parent, yes, no) {
    return {
        parent: parent,
        yes: yes,
        no: no
    };
}


// cyclone physics engine (book by ian mellington)

min.PH.createParticlePhysics = createParticlePhysics;
min.PH.createRigidBodyPhysics = createParticlePhysics;
min.PH.ForceGenerator = ForceGenerator;
min.PH.ForceGenerator.create = ForceGenerator.create;

min.PH.ParticleLink = ParticleLink;
min.PH.createParticleLink = createParticleLink;


// math must be column-major
min.GL.Vec3 = Vec3;
min.GL.Mat4 = Mat4;
min.GL.Mat34 = Mat34;
min.GL.Mat3 = Mat3;
min.GL.Quaternion = Quaternion;
min.GL.createIntelligence = createIntelligence; // some living or thinking or just moving
min.GL.createPlayer = createPlayer;     // player 


/*
 conventions:
 first argument is the gl context
 i didnt bother to connect it to the controller
 for more convenience to change behavior
 */

function Program(gl, vs, fs, attList, uniformList) {
    this.vertexShader = null;
    this.fragmentShader = null;
    this.program = null;
    this.attributes = {};
    this.uniforms = {};
    this.attributeList = [];
    this.uniformList = [];
    var vs = Shader.create(gl, gl.VERTEX_SHADER, vs);
    var fs = Shader.create(gl, gl.FRAGMENT_SHADER, fs);
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("error linking program: " + gl.getProgramInfoLog(program));
    }
    this.attributeList = attributeList;
    this.uniformList = uniformList;
    this.program = program;
    this.vertexShader = vs;
    this.fragmentShader = fs;
    this.attributes = {};
    this.uniforms = {};
}


Program.prototype = {
    getUniforms: function getUniforms(list) {
        var program = this.program;
        var gl = this.gl;
        list.forEach(function (key) {
            program[key] = gl.getUniformLocation(program, key);
        });
    },

    getAttributes: function getAttributes(list) {
        list.forEach(function (key) {
            program[key] = gl.getAttribLocation(program, key);
        });
    }
};

function Shader(gl, type, source) {
    this.source = null;
    this.type = null;
    this.shader = null;

    source = document.getElementById(source).textContent;
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("error compiling shader: " + gl.getShaderInfoLog(shader));
    }
    this.shader = shader;
    this.type = type;
    this.source = source;
}

Shader.prototype = {};

var programStack = min.GL.programStack = [];
function pushProgram(program) {
    programStack.push(program);
}
function popProgram() {
    return programStack.pop();
}

var modelViewStack = min.GL.modelViewStack = [];
function pushModelView(modelView) {
    "use strict";
    var copy = mat4.create();
    mat4.copy(copy, modelView);
    return modelViewStack.push(copy);
}
function popModelView() {
    return modelViewStack.pop();
}


min.GL.Camera = {};
min.GL.Camera.create = createCamera;
min.GL.Program = {};
min.GL.Program.create = createProgram;
min.GL.Light = {};
min.GL.Light.create = createLight;

min.GL.Picker = Picker;
function Picker() {

}
Picker.create = function () {

};
Picker.prototype = {};


min["2D"] = {
    getContext: function (id, options) {
        this.context = document.getElementById(id).getContext("2d", options);
        this.canvas = this.context.canvas;
    }
};

// webgl simplified
min.GL.programStack = programStack;
min.GL.pushProgram = pushProgram;
min.GL.popProgram = popProgram;
min.GL.modelViewStack = modelViewStack;
min.GL.pushModelView = pushModelView;
min.GL.popModelView = popModelView;
min.GL.createProgram = createProgram;
min.GL.createShader = createShader;
min.GL.createMatrices = createMatrices;
min.GL.createOffscreenFramebuffer = createOffscreenFramebuffer;
min.GL.createLight = createLight;
min.GL.createFrustum = createFrustum;
min.GL.createCamera = createCamera;
min.GL.createMesh = createMesh;
min.GL.createBuffers = createBuffers;
min.GL.createTexture = createTexture;
min.GL.createMaterial = createMaterial;
min.GL.getLocations = getLocations;
min.GL.getAttributes = getAttributes;
min.GL.getUniforms = getUniforms;
min.GL.getContext = getContext;
min.GL.getCanvas = getCanvas;
min.GL.uploadMatrix3 = uploadMatrix3;
min.GL.drawGenericMesh = drawGenericMesh;

min.GL.printObj = printObj;
min.GL.showMatrix4 = showMatrix4;
min.GL.showMatrix3 = showMatrix3;

/*
 Upgrade to MVC oop using these procedures for help til replacement
 */

function createIntelligence(mesh, decl) {
    decl = decl || {};
    var intelligence = {};
    if (!typeof decl.updateIntelligence != "function") {
        throw new TypeError("implement updateIntelligence(time) for the intelligence.");
    }
    _mixin_(intelligence, decl);
    _mixin_(mesh, intelligence);
}

function createPlayer(mesh, decl) {
    decl = decl || {};
    var player = {
        steering: false,
        manual: true,
    };
    if (!typeof decl.updatePlayer != "function") {
        throw new TypeError("implement updatePlayer(time) for the player");
    }
    _mixin_(player, decl);
    _mixin_(mesh, player);
}


function Fireworks(parent, type) {
    "use strict";
    this.parent = parent;
    this.type = 1;
    this.age = 10;
}
Fireworks.prototype = _mixin_(new Particle(), {
    update: function (gl, program, time) {
        this.integrate(time);
        this.age -= time;
        return (this.age < 0);
        return;
    },
    draw: function (gl, program, time) {
        "use strict";
        gl.vertexAttrib3fv(program.aVertexPosition, this.position);
        gl.uniformMatrix4fv(program.uMVMatrix, false, this.modelMatrix);
        gl.drawArrays(gl.POINTS, 0, 1);
    },
    addPayloads: function (rule, parent) {
        "use strict";
        for (var i = 0; i < 5; i++)
            this.payload.push(createFireworks());
    }
});

function FireworksRule(type, minAge, maxAge, damping) {
    this.type = type;
    this.minAge = minAge;
    this.maxAge = maxAge;
    this.damping = damping;
    this.minVelocity = Vec3.create(0, 0, 0);
    this.maxVelocity = Vec3.create(5, 5, 5);
}
FireworksRule.prototype = {
    create: function (firework, parent) {
        parent = parent || null;
        firework.type = this.type;
        firework.age = Math.max(Math.random() * this.minAge, Math.random() * this.maxAge);
        if (parent) firework.position = Vec3.create(parent.position);
        var vel = Vec3.create(parent.velocity);
        Vec3.add(vel, vel, Vec3.random());
        firework.velocity = vel;
        firework.setMass(1);
        firework.damping = this.damping;
        firework.acceleration = Vec3.create(0, -9.81, 0);
        firework.clearAccumulator();
    }
};

function FireworksDemo() {
    this.rules = [];
    this.particles = [];
    this.index = 0;

}
FireworksDemo.prototype = {
    create: function (type, parent) {
        if (this.index > particles.length) return;
        var rule = this.rules[type];
        rule.create(this.particles[this.index]);
        this.index += 1;

    },
    update: function (gl, program, time) {
        for (var i = 0, j = this.particles.length; i < j; i++) {
            var fw = this.particles[i];
            if (fw.type > 0) {

                if (fw.update(gl, program, time)) {
                    // if age < 0
                    var rule = this.rules[fw.type];
                    fw.type = 0;
                    // remove
                    this.particles = this.particles.filter(function (p) {
                        return p != fw;
                    });
                    // add payloads
                    for (var i = 0; i < 5; i++) {
                        this.particles.push(createFireworks(i))
                    }
                }
            } else {

            }
        }

    },
    initFireworksDemo: function () {

        var r0 = createFireworkRule(1, 0.01, 5, 1.00);
        var r1 = createFireworkRule(2, 0.01, 5, 1.00);
        var r2 = createFireworkRule(3, 0.01, 5, 1.00);
        var r3 = createFireworkRule(4, 0.01, 5, 1.00);
        var r4 = createFireworkRule(5, 0.01, 5, 1.00);
        this.index = 0;

    }
};


var ForceGenerator = {
    ForceGenerator: ForceGenerator,
    create: ForceGenerator.create,
    GravityForceGenerator: GravityForceGenerator,
    DragForceGenerator: DragForceGenerator,
    SpringForceGenerator: SpringForceGenerator,
    AnchoredSpringForceGenerator: AnchoredSpringForceGenerator,
    BungeeSpringForceGenerator: BungeeSpringForceGenerator,
    BuoyancySpringForceGenerator: BuoyancySpringForceGenerator,
    FakeSpringForceGenerator: FakeSpringForceGenerator
};
min.PH.ForceGenerator = ForceGenerator;
var TorqueGenerator = {
    TorqueGenerator: TorqueGenerator,
    create: createTorqueGenerator
};

var BoundingVolumes = {
    BoundingSphere: BoundingSphere,
    BoundingBox: BoundingBox
};
min.PH.BoundingVolumes = BoundingVolumes;
min.PH.CollisionDetector = CollisionDetector;
min.PH.IntersectionTests = IntersectionTests;
min.PH.RigidBody = RigidBody;
min.PH.Particle = Particle;
min.PH.ForceGenerator.create = ForceGenerator.create;


function rand() {
    return Math.random() * 10 / 10;
}
function createRectangles(width, height, cols, rows, x, y, z) {
    var vertices = []
    var indices = [];
    var x = x || 0;
    var y = y || 0;
    var z = z || 0;
    var row = 0;
    var index = 0;
    if (rows === undefined) rows = 0;
    do {

        for (var i = 0; i < 4 * cols; i += 4) {
            var x = 0 + i * width;
            var y = 0 + height * row;

            vertices.push(x);
            vertices.push(y);
            vertices.push(z);

            indices.push(index);  // 0

            y += height;
            x = 0 + i * width
            vertices.push(x);
            vertices.push(y);
            vertices.push(z);

            indices.push(index += 1); // 1

            x += width;
            y -= height;
            vertices.push(x);
            vertices.push(y);
            vertices.push(z);

            indices.push(index += 1); // 2
            indices.push(index); // 2
            indices.push(index -= 1); // 1

            y += height;
            vertices.push(x);
            vertices.push(y);
            vertices.push(z);
            y -= height;

            indices.push(index += 2); // 3
            index += 1; // 456 547
        }
        ++row;
    } while (rows >= row);

    return {
        vertices: vertices,
        indices: indices
    };
}

var smallQuad = createRectangles(0.1, 0.1, 10, 10, -0.1, 0.1, -0.1);
var largeQuad = createRectangles(0.2, 0.2, 10, 10, -0.1, 0.1, -0.1);


min.AU.createContext = function () {
    var C = window.mozAudioContext || window.webkitAudioContext || window.msAudioContext || window.oAudioContext || window.AudioContext;
    if (C)
        return new C;
    else alert("can´t get webaudio context");
};

min.AU.loadAndDecode = function (context, url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function (e) {
        if (xhr.status === 200 || xhr.status === 304) {
            context.decodeAudioData(
                xhr.response,
                function (buffer) {
                    callback(null, buffer);
                },
                function (error) {
                    callback(error);
                });
        } else {
            callback(new TypeError("Can´t load buffer"));
        }
    };
    xhr.send(null);
};
min.AU.playBuffer = function (context, buffer) {
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
};

min.AU.loadAndPlay = function (context, url) {
    min.AU.loadAndDecode(context, url, function (error, buffer) {
        if (error) throw error;
        min.AU.playBuffer(context, buffer);
    });
};

min.AU.visualize = function (context2d, context, buffer) {
};

min.AU.getAnalyser = function (context) {
};

min.AU.createSong = function () {
    return new min.AU.Song();
};

min.AU.Song = Song;
function Song() {
    this.tracks = [];
    this.samples = [];
}
Song.prototype = {
    play: function () {
    },
    pause: function () {
    },
    stop: function () {
    }
};

if (typeof exports != "undefined") {
    _mixin_(exports, min);
    _mixin_(exports, min.GL);
}


var quad = {
    "vertices": [-1, -1, 1, -1, -1, 1, 1, 1],
    "items": 4,
    "size": 2
};

var wallMesh = {
    "vertices": [-15.0, 0.0, -0.5, -15.0, 0.0, 0.5, -15.0, 10.0, -0.5, -15.0, 10.0, 0.5, 15.0, 0.0, -0.5, 15.0, 10.0, -0.5, 15.0, 0.0, 0.5, 15.0, 10.0, 0.5, -15.0, 0.0, -0.5, 15.0, 0.0, -0.5, -15.0, 0.0, 0.5, 15.0, 0.0, 0.5, -15.0, 10.0, -0.5, -15.0, 10.0, 0.5, 15.0, 10.0, -0.5, 15.0, 10.0, 0.5, -15.0, 0.0, -0.5, -15.0, 10.0, -0.5, 15.0, 0.0, -0.5, 15.0, 10.0, -0.5, -15.0, 0.0, 0.5, 15.0, 0.0, 0.5, -15.0, 10.0, 0.5, 15.0, 10.0, 0.5],
    "indices": [0, 1, 2, 3, 2, 1, 4, 5, 6, 7, 6, 5, 8, 9, 10, 11, 10, 9, 12, 13, 14, 15, 14, 13, 16, 17, 18, 19, 18, 17, 20, 21, 22, 23, 22, 21],
    "diffuse": [1.0, 1.0, 1.0, 1.0],
    "ambient": [0.1, 0.1, 0.1, 1.0]
};

var flagMesh = {
    "vertices": [0.25, 5.0, 0.0, 0.25, 0.0, 0.0, 0.176776, 0.0, -0.176776, 0.176776, 5.0, -0.176776, -5.1276e-11, 0.0, -0.25, -5.1276e-11, 5.0, -0.25, -0.176776, 0.0, -0.176776, -0.176776, 5.0, -0.176776, -0.25, 0.0, 1.02552e-10, -0.25, 5.0, 1.02552e-10, -0.176776, 0.0, 0.176776, -0.176776, 5.0, 0.176776, 1.53828e-10, 0.0, 0.25, 1.53828e-10, 5.0, 0.25, 0.176776, 0.0, 0.176776, 0.176776, 5.0, 0.176776, 0.176776, 5.0, -0.176776, -5.1276e-11, 5.0, -0.25, 0.25, 5.0, 0.0, 0.176776, 5.0, 0.176776, 1.53828e-10, 5.0, 0.25, -0.176776, 5.0, 0.176776, -0.176776, 5.0, -0.176776, -0.25, 5.0, 1.02552e-10, -0.176776, 0.0, 0.176776, -0.25, 0.0, 1.02552e-10, 1.53828e-10, 0.0, 0.25, -0.176776, 0.0, -0.176776, -5.1276e-11, 0.0, -0.25, 0.176776, 0.0, -0.176776, 0.176776, 0.0, 0.176776, 0.25, 0.0, 0.0, 0.650825, -6.5944e-08, 1.35145, 0.601285, 0.17198, 1.35145, 0.0, -6.5944e-08, 1.5, 0.460203, 0.317777, 1.35145, 0.24906, 0.415196, 1.35145, -2.84485e-08, 0.449404, 1.35145, -0.24906, 0.415196, 1.35145, -0.460204, 0.317777, 1.35145, -0.601285, 0.17198, 1.35145, -0.650825, -1.05233e-07, 1.35145, 0.650825, -6.5944e-08, -1.35145, 0.0, -6.5944e-08, -1.5, 0.601285, 0.17198, -1.35145, 0.460203, 0.317777, -1.35145, 0.24906, 0.415195, -1.35145, -2.84485e-08, 0.449404, -1.35145, -0.24906, 0.415195, -1.35145, -0.460203, 0.317777, -1.35145, -0.601285, 0.17198, -1.35145, -0.650825, -1.05233e-07, -1.35145, 1.17274, -6.5944e-08, 0.935235, 1.08347, 0.309896, 0.935235, 1.46239, -6.5944e-08, 0.333782, 1.35108, 0.386435, 0.333782, 1.46239, -6.5944e-08, -0.333782, 1.35108, 0.386435, -0.333782, 1.17274, -6.5944e-08, -0.935235, 1.08347, 0.309896, -0.935235, 0.82926, 0.572615, 0.935235, 1.03407, 0.71404, 0.333782, 1.03407, 0.71404, -0.333782, 0.829255, 0.572615, -0.935235, 0.448791, 0.748155, 0.935235, 0.559635, 0.932935, 0.333782, 0.559635, 0.932935, -0.333782, 0.448791, 0.748155, -0.935235, -5.12625e-08, 0.8098, 0.935235, -6.3923e-08, 1.0098, 0.333782, -6.3923e-08, 1.0098, -0.333782, -5.12625e-08, 0.8098, -0.935235, -0.448791, 0.748155, 0.935235, -0.559635, 0.932935, 0.333782, -0.559635, 0.932935, -0.333782, -0.448791, 0.748155, -0.935235, -0.82926, 0.572615, 0.935235, -1.03407, 0.71404, 0.333782, -1.03407, 0.71404, -0.333782, -0.82926, 0.572615, -0.935235, -1.08347, 0.309896, 0.935235, -1.35108, 0.386435, 0.333782, -1.35108, 0.386435, -0.333782, -1.08347, 0.309896, -0.935235, -1.17274, -1.36739e-07, 0.935235, -1.46239, -1.54224e-07, 0.333782, -1.46239, -1.54224e-07, -0.333782, -1.17274, -1.36739e-07, -0.935235, -0.309743, 6.1407, 0.0477631, -0.309743, 5.8688, -0.313451, -0.309743, 5.8688, 0.408977, -0.309743, 5.2123, 0.558595, -0.309743, 5.2123, -0.46307, -0.309743, 4.55586, 0.408977, -0.309743, 4.55586, -0.313451, -0.309743, 4.28394, 0.0477631, 2.41736, 5.2123, 0.0477631],
    "indices": [0, 1, 2, 0, 2, 3, 3, 2, 4, 3, 4, 5, 5, 4, 6, 5, 6, 7, 7, 6, 8, 7, 8, 9, 9, 8, 10, 9, 10, 11, 11, 10, 12, 11, 12, 13, 13, 12, 14, 13, 14, 15, 15, 14, 1, 15, 1, 0, 16, 17, 18, 18, 17, 19, 19, 17, 20, 20, 17, 21, 17, 22, 21, 23, 21, 22, 24, 25, 26, 25, 27, 26, 27, 28, 26, 28, 29, 26, 26, 29, 30, 31, 30, 29, 32, 33, 34, 33, 35, 34, 35, 36, 34, 36, 37, 34, 37, 38, 34, 38, 39, 34, 39, 40, 34, 40, 41, 34, 42, 43, 44, 44, 43, 45, 45, 43, 46, 46, 43, 47, 47, 43, 48, 48, 43, 49, 49, 43, 50, 50, 43, 51, 32, 52, 53, 32, 53, 33, 52, 54, 55, 52, 55, 53, 54, 56, 57, 54, 57, 55, 56, 58, 59, 56, 59, 57, 58, 42, 44, 58, 44, 59, 33, 53, 60, 33, 60, 35, 53, 55, 61, 53, 61, 60, 55, 57, 62, 55, 62, 61, 57, 59, 63, 57, 63, 62, 59, 44, 45, 59, 45, 63, 35, 60, 64, 35, 64, 36, 60, 61, 65, 60, 65, 64, 61, 62, 66, 61, 66, 65, 62, 63, 67, 62, 67, 66, 63, 45, 46, 63, 46, 67, 36, 64, 68, 36, 68, 37, 64, 65, 69, 64, 69, 68, 65, 66, 70, 65, 70, 69, 66, 67, 71, 66, 71, 70, 67, 46, 47, 67, 47, 71, 37, 68, 72, 37, 72, 38, 68, 69, 73, 68, 73, 72, 69, 70, 74, 69, 74, 73, 70, 71, 75, 70, 75, 74, 71, 47, 48, 71, 48, 75, 38, 72, 76, 38, 76, 39, 72, 73, 77, 72, 77, 76, 73, 74, 78, 73, 78, 77, 74, 75, 79, 74, 79, 78, 75, 48, 49, 75, 49, 79, 39, 76, 80, 39, 80, 40, 76, 77, 81, 76, 81, 80, 77, 78, 82, 77, 82, 81, 78, 79, 83, 78, 83, 82, 79, 49, 50, 79, 50, 83, 40, 80, 84, 40, 84, 41, 80, 81, 85, 80, 85, 84, 81, 82, 86, 81, 86, 85, 82, 83, 87, 82, 87, 86, 83, 50, 51, 83, 51, 87, 88, 89, 90, 90, 89, 91, 89, 92, 91, 91, 92, 93, 92, 94, 93, 95, 93, 94, 96, 95, 94, 96, 94, 92, 96, 92, 89, 96, 89, 88, 96, 88, 90, 96, 90, 91, 96, 91, 93, 96, 93, 95],
    "diffuse": [0.1, 0.7, 0.1, 1.0]
};

var texCubeMesh = {
    "vertices": [
        -0.5, 0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,

        -0.5, 0.5, 0.5,
        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,

        0.5, 0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,

        0.5, 0.5, -0.5,
        0.5, -0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, 0.5, -0.5,

        -0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,

        -0.5, -0.5, 0.5,
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5
    ],

    "indices": [
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23],

    "scalars": [1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,

        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,

        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,

        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,

        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,

        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0
    ],
    "texture_coords": [
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,

        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0],

    "diffuse": [1.0, 1.0, 1.0, 1.0]
};

var coneMesh = {
    "vertices": [0.0, 6.0, -2.59787e-16, 3.0, 8.88178e-16, 5.19574e-16, 2.99737, 8.88178e-16, -0.125627, 2.98948, 8.88178e-16, -0.251034, 2.97634, 8.88178e-16, -0.376, 2.95799, 8.88178e-16, -0.500306, 2.93444, 8.88178e-16, -0.623735, 2.90575, 8.88178e-16, -0.74607, 2.87196, 8.88178e-16, -0.867095, 2.83313, 8.88178e-16, -0.9866, 2.78933, 8.88178e-16, -1.10437, 2.74064, 8.88178e-16, -1.22021, 2.68714, 8.88178e-16, -1.33391, 2.62892, 8.88178e-16, -1.44526, 2.56609, 8.88178e-16, -1.55408, 2.49876, 8.88178e-16, -1.66017, 2.42705, 8.88178e-16, -1.76336, 2.35108, 8.88178e-16, -1.86344, 2.27099, 8.88178e-16, -1.96026, 2.18691, 8.88178e-16, -2.05364, 2.09899, 8.88178e-16, -2.14342, 2.00739, 8.88178e-16, -2.22943, 1.91227, 8.88178e-16, -2.31154, 1.8138, 8.88178e-16, -2.38959, 1.71214, 8.88178e-16, -2.46345, 1.60748, 8.88178e-16, -2.53298, 1.5, 4.44089e-16, -2.59808, 1.38989, 4.44089e-16, -2.65861, 1.27734, 4.44089e-16, -2.71448, 1.16255, 4.44089e-16, -2.76559, 1.04572, 4.44089e-16, -2.81185, 0.927051, 4.44089e-16, -2.85317, 0.806759, 4.44089e-16, -2.88949, 0.685053, 4.44089e-16, -2.92074, 0.562144, 4.44089e-16, -2.94686, 0.438249, 4.44089e-16, -2.96782, 0.313585, 4.44089e-16, -2.98357, 0.188372, 4.44089e-16, -2.99408, 0.0628273, 4.44089e-16, -2.99934, -0.0628273, 4.44089e-16, -2.99934, -0.188372, 4.44089e-16, -2.99408, -0.313585, 4.44089e-16, -2.98357, -0.438249, 4.44089e-16, -2.96782, -0.562144, 4.44089e-16, -2.94686, -0.685053, 4.44089e-16, -2.92074, -0.806759, 4.44089e-16, -2.88949, -0.927051, 4.44089e-16, -2.85317, -1.04572, 4.44089e-16, -2.81185, -1.16255, 4.44089e-16, -2.76559, -1.27734, 4.44089e-16, -2.71448, -1.38989, 4.44089e-16, -2.65861, -1.5, 4.44089e-16, -2.59808, -1.60748, 8.88178e-16, -2.53298, -1.71214, 8.88178e-16, -2.46345, -1.8138, 8.88178e-16, -2.38959, -1.91227, 8.88178e-16, -2.31154, -2.00739, 8.88178e-16, -2.22943, -2.09899, 8.88178e-16, -2.14342, -2.18691, 8.88178e-16, -2.05364, -2.27099, 8.88178e-16, -1.96026, -2.35108, 8.88178e-16, -1.86344, -2.42705, 8.88178e-16, -1.76336, -2.49876, 8.88178e-16, -1.66017, -2.56609, 8.88178e-16, -1.55408, -2.62892, 8.88178e-16, -1.44526, -2.68714, 8.88178e-16, -1.33391, -2.74064, 8.88178e-16, -1.22021, -2.78933, 8.88178e-16, -1.10437, -2.83313, 8.88178e-16, -0.9866, -2.87196, 8.88178e-16, -0.867095, -2.90575, 8.88178e-16, -0.74607, -2.93444, 8.88178e-16, -0.623735, -2.95799, 8.88178e-16, -0.500306, -2.97634, 8.88178e-16, -0.376, -2.98948, 8.88178e-16, -0.251034, -2.99737, 8.88178e-16, -0.125627, -3.0, 8.88178e-16, 1.23062e-09, -2.99737, 8.88178e-16, 0.125627, -2.98948, 8.88178e-16, 0.251034, -2.97634, 8.88178e-16, 0.376, -2.95799, 8.88178e-16, 0.500306, -2.93444, 8.88178e-16, 0.623735, -2.90575, 8.88178e-16, 0.74607, -2.87196, 8.88178e-16, 0.867095, -2.83313, 8.88178e-16, 0.9866, -2.78933, 8.88178e-16, 1.10437, -2.74064, 8.88178e-16, 1.22021, -2.68714, 8.88178e-16, 1.33391, -2.62892, 8.88178e-16, 1.44526, -2.56609, 8.88178e-16, 1.55408, -2.49876, 8.88178e-16, 1.66017, -2.42705, 8.88178e-16, 1.76336, -2.35108, 8.88178e-16, 1.86344, -2.27099, 8.88178e-16, 1.96026, -2.18691, 8.88178e-16, 2.05364, -2.09899, 8.88178e-16, 2.14342, -2.00739, 8.88178e-16, 2.22943, -1.91227, 8.88178e-16, 2.31154, -1.8138, 8.88178e-16, 2.38959, -1.71214, 8.88178e-16, 2.46345, -1.60748, 8.88178e-16, 2.53298, -1.5, 1.33227e-15, 2.59808, -1.38989, 1.33227e-15, 2.65861, -1.27734, 1.33227e-15, 2.71448, -1.16255, 1.33227e-15, 2.76559, -1.04572, 1.33227e-15, 2.81185, -0.927051, 1.33227e-15, 2.85317, -0.806759, 1.33227e-15, 2.88949, -0.685053, 1.33227e-15, 2.92074, -0.562144, 1.33227e-15, 2.94686, -0.438249, 1.33227e-15, 2.96782, -0.313585, 1.33227e-15, 2.98357, -0.188372, 1.33227e-15, 2.99408, -0.0628273, 1.33227e-15, 2.99934, 0.0628273, 1.33227e-15, 2.99934, 0.188372, 1.33227e-15, 2.99408, 0.313585, 1.33227e-15, 2.98357, 0.438249, 1.33227e-15, 2.96782, 0.562144, 1.33227e-15, 2.94686, 0.685053, 1.33227e-15, 2.92074, 0.806759, 1.33227e-15, 2.88949, 0.927051, 1.33227e-15, 2.85317, 1.04572, 1.33227e-15, 2.81185, 1.16255, 1.33227e-15, 2.76559, 1.27734, 1.33227e-15, 2.71448, 1.38989, 1.33227e-15, 2.65861, 1.5, 1.33227e-15, 2.59808, 1.60748, 8.88178e-16, 2.53298, 1.71214, 8.88178e-16, 2.46345, 1.8138, 8.88178e-16, 2.38959, 1.91227, 8.88178e-16, 2.31154, 2.00739, 8.88178e-16, 2.22943, 2.09899, 8.88178e-16, 2.14342, 2.18691, 8.88178e-16, 2.05364, 2.27099, 8.88178e-16, 1.96026, 2.35108, 8.88178e-16, 1.86344, 2.42705, 8.88178e-16, 1.76336, 2.49876, 8.88178e-16, 1.66017, 2.56609, 8.88178e-16, 1.55408, 2.62892, 8.88178e-16, 1.44526, 2.68714, 8.88178e-16, 1.33391, 2.74064, 8.88178e-16, 1.22021, 2.78933, 8.88178e-16, 1.10437, 2.83313, 8.88178e-16, 0.9866, 2.87196, 8.88178e-16, 0.867095, 2.90575, 8.88178e-16, 0.74607, 2.93444, 8.88178e-16, 0.623735, 2.95799, 8.88178e-16, 0.500306, 2.97634, 8.88178e-16, 0.376, 2.98948, 8.88178e-16, 0.251034, 2.99737, 8.88178e-16, 0.125627, 3.0, 8.88178e-16, -2.46124e-09],
    "indices": [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5, 0, 5, 6, 0, 6, 7, 0, 7, 8, 0, 8, 9, 0, 9, 10, 0, 10, 11, 0, 11, 12, 0, 12, 13, 0, 13, 14, 0, 14, 15, 0, 15, 16, 0, 16, 17, 0, 17, 18, 0, 18, 19, 0, 19, 20, 0, 20, 21, 0, 21, 22, 0, 22, 23, 0, 23, 24, 0, 24, 25, 0, 25, 26, 0, 26, 27, 0, 27, 28, 0, 28, 29, 0, 29, 30, 0, 30, 31, 0, 31, 32, 0, 32, 33, 0, 33, 34, 0, 34, 35, 0, 35, 36, 0, 36, 37, 0, 37, 38, 0, 38, 39, 0, 39, 40, 0, 40, 41, 0, 41, 42, 0, 42, 43, 0, 43, 44, 0, 44, 45, 0, 45, 46, 0, 46, 47, 0, 47, 48, 0, 48, 49, 0, 49, 50, 0, 50, 51, 0, 51, 52, 0, 52, 53, 0, 53, 54, 0, 54, 55, 0, 55, 56, 0, 56, 57, 0, 57, 58, 0, 58, 59, 0, 59, 60, 0, 60, 61, 0, 61, 62, 0, 62, 63, 0, 63, 64, 0, 64, 65, 0, 65, 66, 0, 66, 67, 0, 67, 68, 0, 68, 69, 0, 69, 70, 0, 70, 71, 0, 71, 72, 0, 72, 73, 0, 73, 74, 0, 74, 75, 0, 75, 76, 0, 76, 77, 0, 77, 78, 0, 78, 79, 0, 79, 80, 0, 80, 81, 0, 81, 82, 0, 82, 83, 0, 83, 84, 0, 84, 85, 0, 85, 86, 0, 86, 87, 0, 87, 88, 0, 88, 89, 0, 89, 90, 0, 90, 91, 0, 91, 92, 0, 92, 93, 0, 93, 94, 0, 94, 95, 0, 95, 96, 0, 96, 97, 0, 97, 98, 0, 98, 99, 0, 99, 100, 0, 100, 101, 0, 101, 102, 0, 102, 103, 0, 103, 104, 0, 104, 105, 0, 105, 106, 0, 106, 107, 0, 107, 108, 0, 108, 109, 0, 109, 110, 0, 110, 111, 0, 111, 112, 0, 112, 113, 0, 113, 114, 0, 114, 115, 0, 115, 116, 0, 116, 117, 0, 117, 118, 0, 118, 119, 0, 119, 120, 0, 120, 121, 0, 121, 122, 0, 122, 123, 0, 123, 124, 0, 124, 125, 0, 125, 126, 0, 126, 127, 0, 127, 128, 0, 128, 129, 0, 129, 130, 0, 130, 131, 0, 131, 132, 0, 132, 133, 0, 133, 134, 0, 134, 135, 0, 135, 136, 0, 136, 137, 0, 137, 138, 0, 138, 139, 0, 139, 140, 0, 140, 141, 0, 141, 142, 0, 142, 143, 0, 143, 144, 0, 144, 145, 0, 145, 146, 0, 146, 147, 0, 147, 148, 0, 148, 149, 0, 149, 150, 0, 150, 151],
    "diffuse": [1.0, 0.664, 0.0, 1.0]
};
var planeMesh = {
    "vertices": [-50.0, -5.0, -50.0, 50.0, -5.0, -50.0, -50.0, -5.0, 50.0, 50.0, -5.0, 50.0],
    "indices": [2, 1, 0, 1, 2, 3],
    "ambient": [0.17, 0.19, 0.14, 1.0],
    "diffuse": [0.31, 0.61, 0.21, 1.0]
};

var sphereMesh = {
    "vertices": [0.266111, 5.0, 4.99291, 0.264653, 5.02782, 4.99291, 0.0, 5.0, 5.0, 0.260296, 5.05533, 4.99291, 0.253086, 5.08223, 4.99291, 0.243104, 5.10824, 4.99291, 0.230459, 5.13306, 4.99291, 0.215288, 5.15642, 4.99291, 0.197759, 5.17806, 4.99291, 0.178063, 5.19776, 4.99291, 0.156416, 5.21529, 4.99291, 0.133055, 5.23046, 4.99291, 0.108237, 5.2431, 4.99291, 0.0822328, 5.25309, 4.99291, 0.0553276, 5.2603, 4.99291, 0.0278162, 5.26465, 4.99291, -1.16321e-08, 5.26611, 4.99291, -0.0278162, 5.26465, 4.99291, -0.0553276, 5.2603, 4.99291, -0.0822328, 5.25309, 4.99291, -0.108237, 5.2431, 4.99291, -0.133055, 5.23046, 4.99291, -0.156416, 5.21529, 4.99291, -0.178063, 5.19776, 4.99291, -0.197759, 5.17806, 4.99291, -0.215288, 5.15642, 4.99291, -0.230459, 5.13306, 4.99291, -0.243104, 5.10824, 4.99291, -0.253087, 5.08223, 4.99291, -0.260296, 5.05533, 4.99291, -0.264653, 5.02782, 4.99291, -0.266111, 5.0, 4.99291, -0.264653, 4.97218, 4.99291, -0.260296, 4.94467, 4.99291, -0.253086, 4.91777, 4.99291, -0.243104, 4.89176, 4.99291, -0.230459, 4.86694, 4.99291, -0.215288, 4.84358, 4.99291, -0.197759, 4.82194, 4.99291, -0.178063, 4.80224, 4.99291, -0.156416, 4.78471, 4.99291, -0.133055, 4.76954, 4.99291, -0.108237, 4.7569, 4.99291, -0.0822328, 4.74691, 4.99291, -0.0553275, 4.7397, 4.99291, -0.0278161, 4.73535, 4.99291, 3.48962e-08, 4.73389, 4.99291, 0.0278162, 4.73535, 4.99291, 0.0553276, 4.7397, 4.99291, 0.0822328, 4.74691, 4.99291, 0.108237, 4.7569, 4.99291, 0.133055, 4.76954, 4.99291, 0.156416, 4.78471, 4.99291, 0.178063, 4.80224, 4.99291, 0.197759, 4.82194, 4.99291, 0.215288, 4.84358, 4.99291, 0.230459, 4.86694, 4.99291, 0.243104, 4.89176, 4.99291, 0.253087, 4.91777, 4.99291, 0.260296, 4.94467, 4.99291, 0.264653, 4.97218, 4.99291, 0.26611, 5.0, -4.99291, 0.0, 5.0, -5.0, 0.264653, 5.02782, -4.99291, 0.260295, 5.05533, -4.99291, 0.253086, 5.08223, -4.99291, 0.243104, 5.10824, -4.99291, 0.230458, 5.13306, -4.99291, 0.215288, 5.15642, -4.99291, 0.197759, 5.17806, -4.99291, 0.178063, 5.19776, -4.99291, 0.156416, 5.21529, -4.99291, 0.133055, 5.23046, -4.99291, 0.108237, 5.2431, -4.99291, 0.0822326, 5.25309, -4.99291, 0.0553275, 5.2603, -4.99291, 0.0278161, 5.26465, -4.99291, -1.16321e-08, 5.26611, -4.99291, -0.0278161, 5.26465, -4.99291, -0.0553275, 5.2603, -4.99291, -0.0822327, 5.25309, -4.99291, -0.108237, 5.2431, -4.99291, -0.133055, 5.23046, -4.99291, -0.156416, 5.21529, -4.99291, -0.178063, 5.19776, -4.99291, -0.197759, 5.17806, -4.99291, -0.215288, 5.15642, -4.99291, -0.230458, 5.13306, -4.99291, -0.243104, 5.10824, -4.99291, -0.253086, 5.08223, -4.99291, -0.260295, 5.05533, -4.99291, -0.264653, 5.02782, -4.99291, -0.26611, 5.0, -4.99291, -0.264653, 4.97218, -4.99291, -0.260295, 4.94467, -4.99291, -0.253086, 4.91777, -4.99291, -0.243104, 4.89176, -4.99291, -0.230458, 4.86694, -4.99291, -0.215288, 4.84358, -4.99291, -0.197759, 4.82194, -4.99291, -0.178063, 4.80224, -4.99291, -0.156416, 4.78471, -4.99291, -0.133055, 4.76954, -4.99291, -0.108237, 4.7569, -4.99291, -0.0822326, 4.74691, -4.99291, -0.0553274, 4.7397, -4.99291, -0.0278161, 4.73535, -4.99291, 3.48962e-08, 4.73389, -4.99291, 0.0278162, 4.73535, -4.99291, 0.0553275, 4.7397, -4.99291, 0.0822327, 4.74691, -4.99291, 0.108237, 4.7569, -4.99291, 0.133055, 4.76954, -4.99291, 0.156416, 4.78471, -4.99291, 0.178063, 4.80224, -4.99291, 0.197759, 4.82194, -4.99291, 0.215288, 4.84358, -4.99291, 0.230458, 4.86694, -4.99291, 0.243104, 4.89176, -4.99291, 0.253086, 4.91777, -4.99291, 0.260295, 4.94467, -4.99291, 0.264653, 4.97218, -4.99291, 0.531467, 5.0, 4.97167, 0.528556, 5.05555, 4.97167, 0.795318, 5.0, 4.93634, 0.790961, 5.08313, 4.93634, 1.05691, 5.0, 4.88702, 1.05112, 5.11048, 4.88702, 1.31551, 5.0, 4.82384, 1.30831, 5.13751, 4.82384, 1.57038, 5.0, 4.74699, 1.56178, 5.16415, 4.74699, 1.8208, 5.0, 4.65668, 1.81083, 5.19033, 4.65668, 2.06606, 5.0, 4.55317, 2.05474, 5.21596, 4.55317, 2.30546, 5.0, 4.43676, 2.29283, 5.24099, 4.43676, 2.53833, 5.0, 4.30777, 2.52442, 5.26533, 4.30777, 2.764, 5.0, 4.16657, 2.74886, 5.28892, 4.16657, 2.98184, 5.0, 4.01356, 2.9655, 5.31169, 4.01356, 3.19122, 5.0, 3.84917, 3.17374, 5.33357, 3.84917, 3.39156, 5.0, 3.67387, 3.37298, 5.35451, 3.67387, 3.58228, 5.0, 3.48816, 3.56266, 5.37445, 3.48816, 3.76285, 5.0, 3.29256, 3.74224, 5.39333, 3.29256, 3.93276, 5.0, 3.08762, 3.91121, 5.41109, 3.08762, 4.09151, 5.0, 2.87394, 4.0691, 5.42768, 2.87394, 4.23867, 5.0, 2.6521, 4.21545, 5.44306, 2.6521, 4.37382, 5.0, 2.42275, 4.34986, 5.45719, 2.42275, 4.49656, 5.0, 2.18654, 4.47193, 5.47002, 2.18654, 4.60656, 5.0, 1.94412, 4.58132, 5.48152, 1.94412, 4.7035, 5.0, 1.69619, 4.67774, 5.49165, 1.69619, 4.78711, 5.0, 1.44346, 4.76089, 5.50039, 1.44346, 4.85715, 5.0, 1.18663, 4.83054, 5.50771, 1.18663, 4.91342, 5.0, 0.926443, 4.8865, 5.51359, 0.926443, 4.95576, 5.0, 0.663627, 4.92862, 5.51802, 0.663627, 4.98406, 5.0, 0.39893, 4.95676, 5.52098, 0.39893, 4.99823, 5.0, 0.133102, 4.97085, 5.52246, 0.133102, 4.99823, 5.0, -0.133103, 4.97085, 5.52246, -0.133103, 4.98406, 5.0, -0.398931, 4.95676, 5.52098, -0.398931, 4.95576, 5.0, -0.663628, 4.92862, 5.51802, -0.663628, 4.91342, 5.0, -0.926444, 4.8865, 5.51359, -0.926444, 4.85715, 5.0, -1.18663, 4.83054, 5.50771, -1.18663, 4.78711, 5.0, -1.44346, 4.76089, 5.50039, -1.44346, 4.7035, 5.0, -1.69619, 4.67773, 5.49165, -1.69619, 4.60656, 5.0, -1.94412, 4.58132, 5.48152, -1.94412, 4.49656, 5.0, -2.18654, 4.47193, 5.47002, -2.18654, 4.37382, 5.0, -2.42275, 4.34985, 5.45719, -2.42275, 4.23867, 5.0, -2.6521, 4.21545, 5.44306, -2.6521, 4.09151, 5.0, -2.87394, 4.0691, 5.42768, -2.87394, 3.93276, 5.0, -3.08762, 3.91121, 5.41109, -3.08762, 3.76285, 5.0, -3.29256, 3.74224, 5.39333, -3.29256, 3.58228, 5.0, -3.48816, 3.56266, 5.37445, -3.48816, 3.39156, 5.0, -3.67387, 3.37298, 5.35451, -3.67387, 3.19122, 5.0, -3.84917, 3.17374, 5.33357, -3.84917, 2.98184, 5.0, -4.01356, 2.9655, 5.31169, -4.01356, 2.764, 5.0, -4.16657, 2.74886, 5.28892, -4.16657, 2.53833, 5.0, -4.30777, 2.52442, 5.26533, -4.30777, 2.30546, 5.0, -4.43676, 2.29283, 5.24099, -4.43676, 2.06606, 5.0, -4.55317, 2.05474, 5.21596, -4.55317, 1.8208, 5.0, -4.65668, 1.81083, 5.19033, -4.65668, 1.57038, 5.0, -4.74699, 1.56178, 5.16415, -4.74699, 1.31551, 5.0, -4.82384, 1.30831, 5.13751, -4.82384, 1.05691, 5.0, -4.88702, 1.05112, 5.11048, -4.88702, 0.795317, 5.0, -4.93634, 0.79096, 5.08313, -4.93634, 0.531467, 5.0, -4.97167, 0.528556, 5.05555, -4.97167, 0.519854, 5.1105, 4.97167, 0.777938, 5.16536, 4.93634, 1.03382, 5.21974, 4.88702, 1.28677, 5.27351, 4.82384, 1.53607, 5.3265, 4.74699, 1.78101, 5.37857, 4.65668, 2.02091, 5.42956, 4.55317, 2.25508, 5.47933, 4.43676, 2.48286, 5.52775, 4.30777, 2.7036, 5.57467, 4.16657, 2.91668, 5.61996, 4.01356, 3.12149, 5.66349, 3.84917, 3.31745, 5.70514, 3.67387, 3.504, 5.7448, 3.48816, 3.68063, 5.78234, 3.29256, 3.84682, 5.81767, 3.08762, 4.0021, 5.85067, 2.87394, 4.14605, 5.88127, 2.6521, 4.27824, 5.90937, 2.42275, 4.3983, 5.93489, 2.18654, 4.5059, 5.95776, 1.94412, 4.60072, 5.97791, 1.69619, 4.6825, 5.9953, 1.44346, 4.75101, 6.00986, 1.18663, 4.80605, 6.02156, 0.926443, 4.84747, 6.03036, 0.663627, 4.87515, 6.03624, 0.39893, 4.889, 6.03919, 0.133102, 4.889, 6.03919, -0.133103, 4.87515, 6.03624, -0.398931, 4.84747, 6.03036, -0.663628, 4.80605, 6.02156, -0.926444, 4.75101, 6.00986, -1.18663, 4.6825, 5.9953, -1.44346, 4.60072, 5.97791, -1.69619, 4.5059, 5.95776, -1.94412, 4.3983, 5.93489, -2.18654, 4.27824, 5.90937, -2.42275, 4.14605, 5.88127, -2.6521, 4.0021, 5.85067, -2.87394, 3.84682, 5.81767, -3.08762, 3.68063, 5.78234, -3.29256, 3.504, 5.7448, -3.48816, 3.31745, 5.70514, -3.67387, 3.12148, 5.66349, -3.84917, 2.91668, 5.61996, -4.01356, 2.7036, 5.57467, -4.16657, 2.48286, 5.52775, -4.30777, 2.25508, 5.47933, -4.43676, 2.02091, 5.42956, -4.55317, 1.78101, 5.37857, -4.65668, 1.53607, 5.3265, -4.74699, 1.28677, 5.27351, -4.82384, 1.03382, 5.21974, -4.88702, 0.777937, 5.16536, -4.93634, 0.519853, 5.1105, -4.97167, 0.505456, 5.16423, 4.97167, 0.756392, 5.24577, 4.93634, 1.00518, 5.3266, 4.88702, 1.25113, 5.40652, 4.82384, 1.49352, 5.48528, 4.74699, 1.73169, 5.56266, 4.65668, 1.96494, 5.63845, 4.55317, 2.19263, 5.71243, 4.43676, 2.41409, 5.78439, 4.30777, 2.62872, 5.85412, 4.16657, 2.8359, 5.92144, 4.01356, 3.03503, 5.98614, 3.84917, 3.22556, 6.04805, 3.67387, 3.40695, 6.10699, 3.48816, 3.57869, 6.16279, 3.29256, 3.74027, 6.21529, 3.08762, 3.89126, 6.26435, 2.87394, 4.03122, 6.30982, 2.6521, 4.15975, 6.35158, 2.42275, 4.27648, 6.38951, 2.18654, 4.3811, 6.42351, 1.94412, 4.4733, 6.45346, 1.69619, 4.55281, 6.4793, 1.44346, 4.61942, 6.50094, 1.18663, 4.67294, 6.51833, 0.926443, 4.71321, 6.53142, 0.663627, 4.74012, 6.54016, 0.39893, 4.7536, 6.54454, 0.133102, 4.7536, 6.54454, -0.133103, 4.74012, 6.54016, -0.398931, 4.71321, 6.53142, -0.663628, 4.67294, 6.51833, -0.926444, 4.61942, 6.50094, -1.18663, 4.55281, 6.4793, -1.44346, 4.4733, 6.45346, -1.69619, 4.3811, 6.42351, -1.94412, 4.27648, 6.38951, -2.18654, 4.15975, 6.35158, -2.42275, 4.03122, 6.30982, -2.6521, 3.89126, 6.26435, -2.87394, 3.74027, 6.21529, -3.08762, 3.57869, 6.16279, -3.29256, 3.40695, 6.10699, -3.48816, 3.22556, 6.04805, -3.67387, 3.03503, 5.98614, -3.84917, 2.8359, 5.92144, -4.01356, 2.62872, 5.85412, -4.16657, 2.41409, 5.78439, -4.30777, 2.19262, 5.71243, -4.43676, 1.96494, 5.63845, -4.55317, 1.73169, 5.56266, -4.65668, 1.49352, 5.48528, -4.74699, 1.25113, 5.40652, -4.82384, 1.00518, 5.3266, -4.88702, 0.756391, 5.24577, -4.93634, 0.505455, 5.16423, -4.97167, 0.48552, 5.21617, 4.97167, 0.726559, 5.32348, 4.93634, 0.965538, 5.42989, 4.88702, 1.20178, 5.53507, 4.82384, 1.43462, 5.63873, 4.74699, 1.66339, 5.74059, 4.65668, 1.88744, 5.84034, 4.55317, 2.10614, 5.93772, 4.43676, 2.31888, 6.03243, 4.30777, 2.52504, 6.12422, 4.16657, 2.72404, 6.21282, 4.01356, 2.91533, 6.29799, 3.84917, 3.09834, 6.37947, 3.67387, 3.27258, 6.45705, 3.48816, 3.43754, 6.53049, 3.29256, 3.59275, 6.5996, 3.08762, 3.73778, 6.66417, 2.87394, 3.87222, 6.72402, 2.6521, 3.99568, 6.77899, 2.42275, 4.10781, 6.82892, 2.18654, 4.2083, 6.87366, 1.94412, 4.29686, 6.91309, 1.69619, 4.37324, 6.94709, 1.44346, 4.43723, 6.97558, 1.18663, 4.48863, 6.99847, 0.926443, 4.52732, 7.01569, 0.663627, 4.55317, 7.0272, 0.39893, 4.56611, 7.03296, 0.133102, 4.56611, 7.03296, -0.133103, 4.55317, 7.0272, -0.398931, 4.52732, 7.01569, -0.663628, 4.48863, 6.99847, -0.926444, 4.43723, 6.97558, -1.18663, 4.37324, 6.94709, -1.44346, 4.29686, 6.91309, -1.69619, 4.2083, 6.87366, -1.94412, 4.10781, 6.82892, -2.18654, 3.99568, 6.77899, -2.42275, 3.87222, 6.72402, -2.6521, 3.73778, 6.66417, -2.87394, 3.59275, 6.5996, -3.08762, 3.43754, 6.53049, -3.29256, 3.27258, 6.45705, -3.48816, 3.09834, 6.37947, -3.67387, 2.91533, 6.29799, -3.84917, 2.72404, 6.21282, -4.01356, 2.52504, 6.12422, -4.16657, 2.31888, 6.03243, -4.30777, 2.10614, 5.93772, -4.43676, 1.88744, 5.84034, -4.55317, 1.66339, 5.74059, -4.65668, 1.43462, 5.63873, -4.74699, 1.20178, 5.53507, -4.82384, 0.965538, 5.42988, -4.88702, 0.726558, 5.32348, -4.93634, 0.485519, 5.21617, -4.97167, 0.460264, 5.26573, 4.97167, 0.688765, 5.39766, 4.93634, 0.915314, 5.52846, 4.88702, 1.13927, 5.65776, 4.82384, 1.35999, 5.78519, 4.74699, 1.57686, 5.9104, 4.65668, 1.78926, 6.03303, 4.55317, 1.99659, 6.15273, 4.43676, 2.19826, 6.26916, 4.30777, 2.39369, 6.382, 4.16657, 2.58235, 6.49092, 4.01356, 2.76368, 6.59561, 3.84917, 2.93718, 6.69578, 3.67387, 3.10235, 6.79114, 3.48816, 3.25873, 6.88143, 3.29256, 3.40587, 6.96638, 3.08762, 3.54335, 7.04576, 2.87394, 3.6708, 7.11934, 2.6521, 3.78784, 7.18691, 2.42275, 3.89414, 7.24828, 2.18654, 3.9894, 7.30328, 1.94412, 4.07335, 7.35175, 1.69619, 4.14576, 7.39356, 1.44346, 4.20641, 7.42858, 1.18663, 4.25515, 7.45671, 0.926443, 4.29182, 7.47788, 0.663627, 4.31632, 7.49203, 0.39893, 4.32859, 7.49911, 0.133102, 4.32859, 7.49911, -0.133103, 4.31632, 7.49203, -0.398931, 4.29182, 7.47788, -0.663628, 4.25515, 7.45671, -0.926444, 4.20641, 7.42857, -1.18663, 4.14576, 7.39356, -1.44346, 4.07335, 7.35175, -1.69619, 3.9894, 7.30328, -1.94412, 3.89414, 7.24828, -2.18654, 3.78784, 7.18691, -2.42275, 3.6708, 7.11934, -2.6521, 3.54335, 7.04576, -2.87394, 3.40587, 6.96638, -3.08762, 3.25873, 6.88143, -3.29256, 3.10235, 6.79114, -3.48816, 2.93718, 6.69578, -3.67387, 2.76368, 6.59561, -3.84917, 2.58235, 6.49092, -4.01356, 2.39369, 6.382, -4.16657, 2.19826, 6.26916, -4.30777, 1.99659, 6.15273, -4.43676, 1.78926, 6.03303, -4.55317, 1.57686, 5.9104, -4.65668, 1.35999, 5.78519, -4.74699, 1.13927, 5.65776, -4.82384, 0.915313, 5.52846, -4.88702, 0.688765, 5.39766, -4.93634, 0.460264, 5.26573, -4.97167, 0.429966, 5.31239, 4.97167, 0.643425, 5.46748, 4.93634, 0.855061, 5.62124, 4.88702, 1.06427, 5.77324, 4.82384, 1.27047, 5.92305, 4.74699, 1.47306, 6.07024, 4.65668, 1.67148, 6.2144, 4.55317, 1.86516, 6.35512, 4.43676, 2.05355, 6.49199, 4.30777, 2.23612, 6.62464, 4.16657, 2.41236, 6.75268, 4.01356, 2.58175, 6.87575, 3.84917, 2.74383, 6.99351, 3.67387, 2.89813, 7.10561, 3.48816, 3.04421, 7.21175, 3.29256, 3.18167, 7.31162, 3.08762, 3.3101, 7.40493, 2.87394, 3.42916, 7.49143, 2.6521, 3.53849, 7.57086, 2.42275, 3.63779, 7.64301, 2.18654, 3.72679, 7.70767, 1.94412, 3.80521, 7.76465, 1.69619, 3.87285, 7.81379, 1.44346, 3.92952, 7.85496, 1.18663, 3.97504, 7.88804, 0.926443, 4.0093, 7.91293, 0.663627, 4.03219, 7.92956, 0.39893, 4.04365, 7.93788, 0.133102, 4.04365, 7.93788, -0.133103, 4.03219, 7.92956, -0.398931, 4.0093, 7.91293, -0.663628, 3.97504, 7.88804, -0.926444, 3.92952, 7.85496, -1.18663, 3.87285, 7.81379, -1.44346, 3.80521, 7.76465, -1.69619, 3.72679, 7.70767, -1.94412, 3.63779, 7.64301, -2.18654, 3.53849, 7.57086, -2.42275, 3.42916, 7.49143, -2.6521, 3.3101, 7.40493, -2.87394, 3.18167, 7.31162, -3.08762, 3.04421, 7.21175, -3.29256, 2.89813, 7.10561, -3.48816, 2.74383, 6.99351, -3.67387, 2.58175, 6.87575, -3.84917, 2.41236, 6.75268, -4.01356, 2.23612, 6.62464, -4.16657, 2.05355, 6.49199, -4.30777, 1.86516, 6.35512, -4.43676, 1.67148, 6.2144, -4.55317, 1.47306, 6.07024, -4.65668, 1.27047, 5.92305, -4.74699, 1.06427, 5.77324, -4.82384, 0.85506, 5.62124, -4.88702, 0.643425, 5.46748, -4.93634, 0.429966, 5.31239, -4.97167, 0.394957, 5.35562, 4.97167, 0.591036, 5.53217, 4.93634, 0.78544, 5.70721, 4.88702, 0.977617, 5.88025, 4.82384, 1.16702, 6.05079, 4.74699, 1.35312, 6.21836, 4.65668, 1.53538, 6.38246, 4.55317, 1.71329, 6.54266, 4.43676, 1.88635, 6.69847, 4.30777, 2.05405, 6.84948, 4.16657, 2.21594, 6.99524, 4.01356, 2.37154, 7.13534, 3.84917, 2.52042, 7.2694, 3.67387, 2.66216, 7.39702, 3.48816, 2.79635, 7.51784, 3.29256, 2.92261, 7.63153, 3.08762, 3.04059, 7.73776, 2.87394, 3.14995, 7.83623, 2.6521, 3.25038, 7.92665, 2.42275, 3.3416, 8.00879, 2.18654, 3.42334, 8.08239, 1.94412, 3.49538, 8.14726, 1.69619, 3.55752, 8.2032, 1.44346, 3.60957, 8.25007, 1.18663, 3.65138, 8.28772, 0.926443, 3.68285, 8.31605, 0.663627, 3.70388, 8.33499, 0.39893, 3.71441, 8.34447, 0.133102, 3.71441, 8.34447, -0.133103, 3.70388, 8.33499, -0.398931, 3.68285, 8.31605, -0.663628, 3.65138, 8.28772, -0.926444, 3.60957, 8.25007, -1.18663, 3.55752, 8.2032, -1.44346, 3.49538, 8.14726, -1.69619, 3.42334, 8.08239, -1.94412, 3.3416, 8.00879, -2.18654, 3.25038, 7.92665, -2.42275, 3.14995, 7.83623, -2.6521, 3.04059, 7.73776, -2.87394, 2.92261, 7.63153, -3.08762, 2.79635, 7.51784, -3.29256, 2.66216, 7.39702, -3.48816, 2.52042, 7.2694, -3.67387, 2.37154, 7.13534, -3.84917, 2.21594, 6.99524, -4.01356, 2.05405, 6.84948, -4.16657, 1.88635, 6.69847, -4.30777, 1.71329, 6.54266, -4.43676, 1.53538, 6.38246, -4.55317, 1.35312, 6.21835, -4.65668, 1.16702, 6.05079, -4.74699, 0.977616, 5.88025, -4.82384, 0.785439, 5.70721, -4.88702, 0.591036, 5.53217, -4.93634, 0.394957, 5.35562, -4.97167, 0.355621, 5.39496, 4.97167, 0.532171, 5.59104, 4.93634, 0.707213, 5.78544, 4.88702, 0.88025, 5.97762, 4.82384, 1.05079, 6.16702, 4.74699, 1.21835, 6.35312, 4.65668, 1.38246, 6.53538, 4.55317, 1.54266, 6.71329, 4.43676, 1.69847, 6.88635, 4.30777, 1.84948, 7.05405, 4.16657, 1.99524, 7.21594, 4.01356, 2.13534, 7.37154, 3.84917, 2.2694, 7.52042, 3.67387, 2.39702, 7.66216, 3.48816, 2.51784, 7.79635, 3.29256, 2.63153, 7.92261, 3.08762, 2.73776, 8.04059, 2.87394, 2.83623, 8.14995, 2.6521, 2.92665, 8.25038, 2.42275, 3.00879, 8.3416, 2.18654, 3.08239, 8.42334, 1.94412, 3.14726, 8.49538, 1.69619, 3.2032, 8.55752, 1.44346, 3.25007, 8.60957, 1.18663, 3.28772, 8.65138, 0.926443, 3.31605, 8.68285, 0.663627, 3.33499, 8.70388, 0.39893, 3.34447, 8.71441, 0.133102, 3.34447, 8.71441, -0.133103, 3.33499, 8.70388, -0.398931, 3.31605, 8.68285, -0.663628, 3.28772, 8.65138, -0.926444, 3.25007, 8.60957, -1.18663, 3.2032, 8.55752, -1.44346, 3.14726, 8.49538, -1.69619, 3.08239, 8.42334, -1.94412, 3.00879, 8.3416, -2.18654, 2.92665, 8.25038, -2.42275, 2.83623, 8.14995, -2.6521, 2.73776, 8.04059, -2.87394, 2.63153, 7.92261, -3.08762, 2.51784, 7.79635, -3.29256, 2.39702, 7.66216, -3.48816, 2.2694, 7.52042, -3.67387, 2.13534, 7.37154, -3.84917, 1.99524, 7.21594, -4.01356, 1.84948, 7.05405, -4.16657, 1.69847, 6.88635, -4.30777, 1.54266, 6.71329, -4.43676, 1.38246, 6.53538, -4.55317, 1.21835, 6.35312, -4.65668, 1.05079, 6.16702, -4.74699, 0.88025, 5.97762, -4.82384, 0.707213, 5.78544, -4.88702, 0.532171, 5.59104, -4.93634, 0.355621, 5.39496, -4.97167, 0.312389, 5.42997, 4.97167, 0.467476, 5.64343, 4.93634, 0.621238, 5.85506, 4.88702, 0.773239, 6.06427, 4.82384, 0.923048, 6.27047, 4.74699, 1.07024, 6.47306, 4.65668, 1.2144, 6.67148, 4.55317, 1.35512, 6.86516, 4.43676, 1.49199, 7.05355, 4.30777, 1.62464, 7.23612, 4.16657, 1.75268, 7.41236, 4.01356, 1.87575, 7.58175, 3.84917, 1.99351, 7.74383, 3.67387, 2.10561, 7.89813, 3.48816, 2.21175, 8.04421, 3.29256, 2.31162, 8.18167, 3.08762, 2.40493, 8.3101, 2.87394, 2.49143, 8.42916, 2.6521, 2.57086, 8.53849, 2.42275, 2.64301, 8.63779, 2.18654, 2.70767, 8.72679, 1.94412, 2.76465, 8.80521, 1.69619, 2.81379, 8.87285, 1.44346, 2.85496, 8.92952, 1.18663, 2.88804, 8.97504, 0.926443, 2.91293, 9.0093, 0.663627, 2.92956, 9.03219, 0.39893, 2.93788, 9.04365, 0.133102, 2.93788, 9.04365, -0.133103, 2.92956, 9.03219, -0.398931, 2.91293, 9.0093, -0.663628, 2.88804, 8.97504, -0.926444, 2.85496, 8.92952, -1.18663, 2.81379, 8.87285, -1.44346, 2.76465, 8.80521, -1.69619, 2.70767, 8.72679, -1.94412, 2.64301, 8.63779, -2.18654, 2.57086, 8.53849, -2.42275, 2.49143, 8.42916, -2.6521, 2.40493, 8.3101, -2.87394, 2.31162, 8.18167, -3.08762, 2.21175, 8.04421, -3.29256, 2.10561, 7.89813, -3.48816, 1.99351, 7.74383, -3.67387, 1.87575, 7.58175, -3.84917, 1.75268, 7.41236, -4.01356, 1.62464, 7.23612, -4.16657, 1.49199, 7.05355, -4.30777, 1.35512, 6.86516, -4.43676, 1.2144, 6.67148, -4.55317, 1.07024, 6.47306, -4.65668, 0.923048, 6.27047, -4.74699, 0.773239, 6.06427, -4.82384, 0.621238, 5.85506, -4.88702, 0.467476, 5.64342, -4.93634, 0.312388, 5.42997, -4.97167, 0.265734, 5.46026, 4.97167, 0.397659, 5.68877, 4.93634, 0.528457, 5.91531, 4.88702, 0.657756, 6.13927, 4.82384, 0.785192, 6.35999, 4.74699, 0.910401, 6.57686, 4.65668, 1.03303, 6.78926, 4.55317, 1.15273, 6.99659, 4.43676, 1.26916, 7.19826, 4.30777, 1.382, 7.39369, 4.16657, 1.49092, 7.58235, 4.01356, 1.59561, 7.76368, 3.84917, 1.69578, 7.93718, 3.67387, 1.79114, 8.10235, 3.48816, 1.88143, 8.25873, 3.29256, 1.96638, 8.40587, 3.08762, 2.04576, 8.54335, 2.87394, 2.11934, 8.6708, 2.6521, 2.18691, 8.78784, 2.42275, 2.24828, 8.89414, 2.18654, 2.30328, 8.9894, 1.94412, 2.35175, 9.07335, 1.69619, 2.39355, 9.14576, 1.44346, 2.42857, 9.20642, 1.18663, 2.45671, 9.25515, 0.926443, 2.47788, 9.29182, 0.663627, 2.49203, 9.31632, 0.39893, 2.49911, 9.32859, 0.133102, 2.49911, 9.32859, -0.133103, 2.49203, 9.31632, -0.398931, 2.47788, 9.29182, -0.663628, 2.45671, 9.25515, -0.926444, 2.42857, 9.20642, -1.18663, 2.39355, 9.14576, -1.44346, 2.35175, 9.07335, -1.69619, 2.30328, 8.9894, -1.94412, 2.24828, 8.89414, -2.18654, 2.18691, 8.78784, -2.42275, 2.11934, 8.6708, -2.6521, 2.04576, 8.54335, -2.87394, 1.96638, 8.40587, -3.08762, 1.88143, 8.25873, -3.29256, 1.79114, 8.10235, -3.48816, 1.69578, 7.93718, -3.67387, 1.59561, 7.76368, -3.84917, 1.49092, 7.58235, -4.01356, 1.382, 7.39369, -4.16657, 1.26916, 7.19826, -4.30777, 1.15273, 6.99659, -4.43676, 1.03303, 6.78926, -4.55317, 0.910401, 6.57686, -4.65668, 0.785192, 6.35999, -4.74699, 0.657756, 6.13927, -4.82384, 0.528456, 5.91531, -4.88702, 0.397659, 5.68876, -4.93634, 0.265733, 5.46026, -4.97167, 0.216167, 5.48552, 4.97167, 0.323485, 5.72656, 4.93634, 0.429885, 5.96554, 4.88702, 0.535067, 6.20178, 4.82384, 0.638732, 6.43462, 4.74699, 0.740587, 6.66339, 4.65668, 0.840343, 6.88744, 4.55317, 0.937716, 7.10614, 4.43676, 1.03243, 7.31888, 4.30777, 1.12422, 7.52504, 4.16657, 1.21282, 7.72404, 4.01356, 1.29799, 7.91533, 3.84917, 1.37947, 8.09834, 3.67387, 1.45705, 8.27258, 3.48816, 1.53049, 8.43754, 3.29256, 1.5996, 8.59275, 3.08762, 1.66417, 8.73778, 2.87394, 1.72402, 8.87222, 2.6521, 1.77899, 8.99568, 2.42275, 1.82892, 9.10781, 2.18654, 1.87366, 9.2083, 1.94412, 1.91309, 9.29686, 1.69619, 1.94709, 9.37324, 1.44346, 1.97558, 9.43723, 1.18663, 1.99847, 9.48863, 0.926443, 2.01569, 9.52732, 0.663627, 2.0272, 9.55317, 0.39893, 2.03296, 9.56611, 0.133102, 2.03296, 9.56611, -0.133103, 2.0272, 9.55317, -0.398931, 2.01569, 9.52732, -0.663628, 1.99847, 9.48863, -0.926444, 1.97558, 9.43723, -1.18663, 1.94709, 9.37324, -1.44346, 1.91309, 9.29686, -1.69619, 1.87366, 9.2083, -1.94412, 1.82892, 9.10781, -2.18654, 1.77899, 8.99568, -2.42275, 1.72402, 8.87222, -2.6521, 1.66417, 8.73778, -2.87394, 1.5996, 8.59275, -3.08762, 1.53049, 8.43754, -3.29256, 1.45705, 8.27258, -3.48816, 1.37947, 8.09834, -3.67387, 1.29799, 7.91533, -3.84917, 1.21282, 7.72404, -4.01356, 1.12422, 7.52504, -4.16657, 1.03243, 7.31888, -4.30777, 0.937716, 7.10614, -4.43676, 0.840342, 6.88744, -4.55317, 0.740587, 6.66339, -4.65668, 0.638732, 6.43462, -4.74699, 0.535067, 6.20178, -4.82384, 0.429885, 5.96554, -4.88702, 0.323485, 5.72656, -4.93634, 0.216167, 5.48552, -4.97167, 0.164232, 5.50546, 4.97167, 0.245767, 5.75639, 4.93634, 0.326604, 6.00518, 4.88702, 0.406516, 6.25113, 4.82384, 0.485275, 6.49352, 4.74699, 0.562659, 6.73169, 4.65668, 0.638448, 6.96494, 4.55317, 0.712427, 7.19263, 4.43676, 0.784387, 7.41409, 4.30777, 0.854123, 7.62872, 4.16657, 0.921438, 7.8359, 4.01356, 0.986141, 8.03503, 3.84917, 1.04805, 8.22556, 3.67387, 1.10699, 8.40695, 3.48816, 1.16279, 8.57869, 3.29256, 1.21529, 8.74028, 3.08762, 1.26435, 8.89126, 2.87394, 1.30982, 9.03122, 2.6521, 1.35158, 9.15975, 2.42275, 1.38951, 9.27648, 2.18654, 1.42351, 9.3811, 1.94412, 1.45346, 9.4733, 1.69619, 1.4793, 9.55281, 1.44346, 1.50094, 9.61942, 1.18663, 1.51833, 9.67294, 0.926443, 1.53142, 9.71321, 0.663627, 1.54016, 9.74012, 0.39893, 1.54454, 9.7536, 0.133102, 1.54454, 9.7536, -0.133103, 1.54016, 9.74012, -0.398931, 1.53142, 9.71321, -0.663628, 1.51833, 9.67294, -0.926444, 1.50094, 9.61942, -1.18663, 1.4793, 9.55281, -1.44346, 1.45346, 9.4733, -1.69619, 1.42351, 9.3811, -1.94412, 1.38951, 9.27648, -2.18654, 1.35158, 9.15975, -2.42275, 1.30982, 9.03122, -2.6521, 1.26435, 8.89126, -2.87394, 1.21529, 8.74027, -3.08762, 1.16279, 8.57869, -3.29256, 1.10699, 8.40695, -3.48816, 1.04805, 8.22556, -3.67387, 0.986141, 8.03503, -3.84917, 0.921438, 7.8359, -4.01356, 0.854123, 7.62872, -4.16657, 0.784387, 7.41409, -4.30777, 0.712427, 7.19263, -4.43676, 0.638448, 6.96494, -4.55317, 0.562659, 6.73169, -4.65668, 0.485275, 6.49352, -4.74699, 0.406516, 6.25113, -4.82384, 0.326604, 6.00518, -4.88702, 0.245766, 5.75639, -4.93634, 0.164232, 5.50546, -4.97167, 0.110498, 5.51985, 4.97167, 0.165356, 5.77794, 4.93634, 0.219745, 6.03382, 4.88702, 0.27351, 6.28677, 4.82384, 0.326501, 6.53607, 4.74699, 0.378566, 6.78101, 4.65668, 0.429558, 7.02091, 4.55317, 0.479333, 7.25508, 4.43676, 0.527748, 7.48286, 4.30777, 0.574668, 7.7036, 4.16657, 0.619959, 7.91668, 4.01356, 0.663492, 8.12148, 3.84917, 0.705145, 8.31745, 3.67387, 0.744799, 8.504, 3.48816, 0.782341, 8.68063, 3.29256, 0.817666, 8.84682, 3.08762, 0.850673, 9.0021, 2.87394, 0.881269, 9.14605, 2.6521, 0.909367, 9.27824, 2.42275, 0.934887, 9.3983, 2.18654, 0.957757, 9.5059, 1.94412, 0.977913, 9.60072, 1.69619, 0.995296, 9.6825, 1.44346, 1.00986, 9.75101, 1.18663, 1.02156, 9.80605, 0.926443, 1.03036, 9.84747, 0.663627, 1.03624, 9.87515, 0.39893, 1.03919, 9.889, 0.133102, 1.03919, 9.889, -0.133103, 1.03624, 9.87515, -0.398931, 1.03036, 9.84747, -0.663628, 1.02156, 9.80605, -0.926444, 1.00986, 9.75101, -1.18663, 0.995296, 9.6825, -1.44346, 0.977913, 9.60072, -1.69619, 0.957757, 9.5059, -1.94412, 0.934887, 9.3983, -2.18654, 0.909367, 9.27824, -2.42275, 0.881269, 9.14605, -2.6521, 0.850673, 9.0021, -2.87394, 0.817666, 8.84682, -3.08762, 0.782341, 8.68063, -3.29256, 0.744798, 8.504, -3.48816, 0.705145, 8.31744, -3.67387, 0.663492, 8.12148, -3.84917, 0.619959, 7.91668, -4.01356, 0.574668, 7.7036, -4.16657, 0.527748, 7.48286, -4.30777, 0.479332, 7.25508, -4.43676, 0.429558, 7.02091, -4.55317, 0.378566, 6.78101, -4.65668, 0.326501, 6.53607, -4.74699, 0.27351, 6.28677, -4.82384, 0.219744, 6.03382, -4.88702, 0.165356, 5.77794, -4.93634, 0.110498, 5.51985, -4.97167, 0.0555535, 5.52856, 4.97167, 0.0831333, 5.79096, 4.93634, 0.110477, 6.05112, 4.88702, 0.137508, 6.30831, 4.82384, 0.16415, 6.56178, 4.74699, 0.190326, 6.81083, 4.65668, 0.215962, 7.05474, 4.55317, 0.240986, 7.29283, 4.43676, 0.265328, 7.52442, 4.30777, 0.288917, 7.74886, 4.16657, 0.311687, 7.9655, 4.01356, 0.333573, 8.17374, 3.84917, 0.354514, 8.37298, 3.67387, 0.37445, 8.56266, 3.48816, 0.393325, 8.74224, 3.29256, 0.411085, 8.91121, 3.08762, 0.42768, 9.0691, 2.87394, 0.443062, 9.21545, 2.6521, 0.457188, 9.34986, 2.42275, 0.470018, 9.47193, 2.18654, 0.481516, 9.58132, 1.94412, 0.49165, 9.67774, 1.69619, 0.500389, 9.76089, 1.44346, 0.50771, 9.83054, 1.18663, 0.513592, 9.8865, 0.926443, 0.518018, 9.92862, 0.663627, 0.520976, 9.95676, 0.39893, 0.522457, 9.97085, 0.133102, 0.522457, 9.97085, -0.133103, 0.520976, 9.95676, -0.398931, 0.518018, 9.92862, -0.663628, 0.513592, 9.8865, -0.926444, 0.50771, 9.83054, -1.18663, 0.500389, 9.76089, -1.44346, 0.49165, 9.67774, -1.69619, 0.481516, 9.58132, -1.94412, 0.470018, 9.47193, -2.18654, 0.457188, 9.34986, -2.42275, 0.443062, 9.21545, -2.6521, 0.427679, 9.0691, -2.87394, 0.411085, 8.91121, -3.08762, 0.393325, 8.74224, -3.29256, 0.37445, 8.56266, -3.48816, 0.354514, 8.37298, -3.67387, 0.333573, 8.17374, -3.84917, 0.311687, 7.9655, -4.01356, 0.288917, 7.74886, -4.16657, 0.265327, 7.52442, -4.30777, 0.240986, 7.29283, -4.43676, 0.215962, 7.05474, -4.55317, 0.190326, 6.81083, -4.65668, 0.16415, 6.56178, -4.74699, 0.137508, 6.30831, -4.82384, 0.110477, 6.05112, -4.88702, 0.0831332, 5.79096, -4.93634, 0.0555534, 5.52856, -4.97167, -2.32312e-08, 5.53147, 4.97167, -3.47644e-08, 5.79532, 4.93634, -4.61991e-08, 6.05691, 4.88702, -5.75029e-08, 6.31551, 4.82384, -6.86437e-08, 6.57038, 4.74699, -7.95898e-08, 6.8208, 4.65668, -9.03104e-08, 7.06606, 4.55317, -1.00775e-07, 7.30546, 4.43676, -1.10954e-07, 7.53833, 4.30777, -1.20818e-07, 7.764, 4.16657, -1.3034e-07, 7.98184, 4.01356, -1.39493e-07, 8.19122, 3.84917, -1.4825e-07, 8.39156, 3.67387, -1.56587e-07, 8.58228, 3.48816, -1.6448e-07, 8.76285, 3.29256, -1.71906e-07, 8.93276, 3.08762, -1.78846e-07, 9.09151, 2.87394, -1.85278e-07, 9.23867, 2.6521, -1.91186e-07, 9.37382, 2.42275, -1.96551e-07, 9.49656, 2.18654, -2.01359e-07, 9.60656, 1.94412, -2.05597e-07, 9.7035, 1.69619, -2.09251e-07, 9.78711, 1.44346, -2.12313e-07, 9.85715, 1.18663, -2.14772e-07, 9.91342, 0.926443, -2.16623e-07, 9.95576, 0.663627, -2.1786e-07, 9.98406, 0.39893, -2.18479e-07, 9.99823, 0.133102, -2.18479e-07, 9.99823, -0.133103, -2.1786e-07, 9.98406, -0.398931, -2.16623e-07, 9.95576, -0.663628, -2.14772e-07, 9.91342, -0.926444, -2.12313e-07, 9.85715, -1.18663, -2.09251e-07, 9.78711, -1.44346, -2.05597e-07, 9.7035, -1.69619, -2.01359e-07, 9.60656, -1.94412, -1.96551e-07, 9.49656, -2.18654, -1.91186e-07, 9.37382, -2.42275, -1.85278e-07, 9.23867, -2.6521, -1.78846e-07, 9.09151, -2.87394, -1.71906e-07, 8.93276, -3.08762, -1.6448e-07, 8.76285, -3.29256, -1.56587e-07, 8.58228, -3.48816, -1.4825e-07, 8.39156, -3.67387, -1.39493e-07, 8.19122, -3.84917, -1.3034e-07, 7.98184, -4.01356, -1.20818e-07, 7.764, -4.16657, -1.10954e-07, 7.53833, -4.30777, -1.00775e-07, 7.30546, -4.43676, -9.03104e-08, 7.06606, -4.55317, -7.95898e-08, 6.8208, -4.65668, -6.86436e-08, 6.57038, -4.74699, -5.75029e-08, 6.31551, -4.82384, -4.61991e-08, 6.05691, -4.88702, -3.47644e-08, 5.79532, -4.93634, -2.32312e-08, 5.53147, -4.97167, -0.0555535, 5.52856, 4.97167, -0.0831334, 5.79096, 4.93634, -0.110478, 6.05112, 4.88702, -0.137509, 6.30831, 4.82384, -0.16415, 6.56178, 4.74699, -0.190326, 6.81083, 4.65668, -0.215962, 7.05474, 4.55317, -0.240987, 7.29283, 4.43676, -0.265328, 7.52442, 4.30777, -0.288917, 7.74886, 4.16657, -0.311687, 7.9655, 4.01356, -0.333574, 8.17374, 3.84917, -0.354515, 8.37298, 3.67387, -0.374451, 8.56266, 3.48816, -0.393326, 8.74224, 3.29256, -0.411085, 8.91121, 3.08762, -0.42768, 9.0691, 2.87394, -0.443062, 9.21545, 2.6521, -0.457188, 9.34986, 2.42275, -0.470019, 9.47193, 2.18654, -0.481517, 9.58132, 1.94412, -0.49165, 9.67774, 1.69619, -0.50039, 9.76089, 1.44346, -0.507711, 9.83054, 1.18663, -0.513593, 9.8865, 0.926443, -0.518019, 9.92862, 0.663627, -0.520976, 9.95676, 0.39893, -0.522457, 9.97085, 0.133102, -0.522457, 9.97085, -0.133103, -0.520976, 9.95676, -0.398931, -0.518019, 9.92862, -0.663628, -0.513593, 9.8865, -0.926444, -0.507711, 9.83054, -1.18663, -0.500389, 9.76089, -1.44346, -0.49165, 9.67774, -1.69619, -0.481517, 9.58132, -1.94412, -0.470019, 9.47193, -2.18654, -0.457188, 9.34986, -2.42275, -0.443062, 9.21545, -2.6521, -0.42768, 9.0691, -2.87394, -0.411085, 8.91121, -3.08762, -0.393325, 8.74224, -3.29256, -0.374451, 8.56266, -3.48816, -0.354515, 8.37298, -3.67387, -0.333574, 8.17374, -3.84917, -0.311687, 7.9655, -4.01356, -0.288917, 7.74886, -4.16657, -0.265328, 7.52442, -4.30777, -0.240987, 7.29283, -4.43676, -0.215962, 7.05474, -4.55317, -0.190326, 6.81083, -4.65668, -0.16415, 6.56178, -4.74699, -0.137509, 6.30831, -4.82384, -0.110478, 6.05112, -4.88702, -0.0831333, 5.79096, -4.93634, -0.0555535, 5.52856, -4.97167, -0.110498, 5.51985, 4.97167, -0.165356, 5.77794, 4.93634, -0.219745, 6.03382, 4.88702, -0.273511, 6.28677, 4.82384, -0.326501, 6.53607, 4.74699, -0.378566, 6.78101, 4.65668, -0.429558, 7.02091, 4.55317, -0.479333, 7.25508, 4.43676, -0.527748, 7.48286, 4.30777, -0.574668, 7.7036, 4.16657, -0.619959, 7.91668, 4.01356, -0.663492, 8.12148, 3.84917, -0.705145, 8.31745, 3.67387, -0.744799, 8.504, 3.48816, -0.782341, 8.68063, 3.29256, -0.817667, 8.84682, 3.08762, -0.850674, 9.0021, 2.87394, -0.88127, 9.14605, 2.6521, -0.909368, 9.27824, 2.42275, -0.934888, 9.3983, 2.18654, -0.957758, 9.5059, 1.94412, -0.977913, 9.60072, 1.69619, -0.995296, 9.6825, 1.44346, -1.00986, 9.75101, 1.18663, -1.02156, 9.80605, 0.926443, -1.03036, 9.84747, 0.663627, -1.03624, 9.87515, 0.39893, -1.03919, 9.889, 0.133102, -1.03919, 9.889, -0.133103, -1.03624, 9.87515, -0.398931, -1.03036, 9.84747, -0.663628, -1.02156, 9.80605, -0.926444, -1.00986, 9.75101, -1.18663, -0.995296, 9.6825, -1.44346, -0.977913, 9.60072, -1.69619, -0.957758, 9.5059, -1.94412, -0.934888, 9.3983, -2.18654, -0.909368, 9.27824, -2.42275, -0.88127, 9.14605, -2.6521, -0.850674, 9.0021, -2.87394, -0.817666, 8.84682, -3.08762, -0.782341, 8.68063, -3.29256, -0.744799, 8.504, -3.48816, -0.705145, 8.31744, -3.67387, -0.663492, 8.12148, -3.84917, -0.619959, 7.91668, -4.01356, -0.574668, 7.7036, -4.16657, -0.527748, 7.48286, -4.30777, -0.479333, 7.25508, -4.43676, -0.429558, 7.02091, -4.55317, -0.378566, 6.78101, -4.65668, -0.326501, 6.53607, -4.74699, -0.27351, 6.28677, -4.82384, -0.219745, 6.03382, -4.88702, -0.165356, 5.77794, -4.93634, -0.110498, 5.51985, -4.97167, -0.164232, 5.50546, 4.97167, -0.245767, 5.75639, 4.93634, -0.326604, 6.00518, 4.88702, -0.406516, 6.25113, 4.82384, -0.485275, 6.49352, 4.74699, -0.562659, 6.73169, 4.65668, -0.638448, 6.96494, 4.55317, -0.712427, 7.19263, 4.43676, -0.784387, 7.41409, 4.30777, -0.854123, 7.62872, 4.16657, -0.921438, 7.8359, 4.01356, -0.986142, 8.03503, 3.84917, -1.04805, 8.22556, 3.67387, -1.10699, 8.40695, 3.48816, -1.16279, 8.57869, 3.29256, -1.21529, 8.74028, 3.08762, -1.26435, 8.89126, 2.87394, -1.30982, 9.03122, 2.6521, -1.35158, 9.15975, 2.42275, -1.38951, 9.27648, 2.18654, -1.42351, 9.3811, 1.94412, -1.45346, 9.4733, 1.69619, -1.4793, 9.55281, 1.44346, -1.50094, 9.61942, 1.18663, -1.51833, 9.67294, 0.926443, -1.53142, 9.71321, 0.663627, -1.54016, 9.74012, 0.39893, -1.54454, 9.7536, 0.133102, -1.54454, 9.7536, -0.133103, -1.54016, 9.74012, -0.398931, -1.53142, 9.71321, -0.663628, -1.51833, 9.67294, -0.926444, -1.50094, 9.61942, -1.18663, -1.4793, 9.55281, -1.44346, -1.45346, 9.4733, -1.69619, -1.42351, 9.3811, -1.94412, -1.38951, 9.27648, -2.18654, -1.35158, 9.15975, -2.42275, -1.30982, 9.03122, -2.6521, -1.26435, 8.89126, -2.87394, -1.21529, 8.74027, -3.08762, -1.16279, 8.57869, -3.29256, -1.10699, 8.40695, -3.48816, -1.04805, 8.22556, -3.67387, -0.986142, 8.03503, -3.84917, -0.921438, 7.8359, -4.01356, -0.854123, 7.62872, -4.16657, -0.784387, 7.41409, -4.30777, -0.712427, 7.19262, -4.43676, -0.638448, 6.96494, -4.55317, -0.562659, 6.73169, -4.65668, -0.485275, 6.49352, -4.74699, -0.406516, 6.25113, -4.82384, -0.326604, 6.00518, -4.88702, -0.245767, 5.75639, -4.93634, -0.164232, 5.50546, -4.97167, -0.216167, 5.48552, 4.97167, -0.323485, 5.72656, 4.93634, -0.429885, 5.96554, 4.88702, -0.535067, 6.20178, 4.82384, -0.638733, 6.43462, 4.74699, -0.740587, 6.66339, 4.65668, -0.840343, 6.88744, 4.55317, -0.937716, 7.10614, 4.43676, -1.03243, 7.31888, 4.30777, -1.12422, 7.52504, 4.16657, -1.21282, 7.72404, 4.01356, -1.29799, 7.91533, 3.84917, -1.37947, 8.09834, 3.67387, -1.45705, 8.27258, 3.48816, -1.53049, 8.43754, 3.29256, -1.5996, 8.59275, 3.08762, -1.66417, 8.73778, 2.87394, -1.72402, 8.87222, 2.6521, -1.77899, 8.99568, 2.42275, -1.82892, 9.10781, 2.18654, -1.87366, 9.2083, 1.94412, -1.91309, 9.29686, 1.69619, -1.94709, 9.37324, 1.44346, -1.97558, 9.43723, 1.18663, -1.99847, 9.48863, 0.926443, -2.01569, 9.52732, 0.663627, -2.0272, 9.55317, 0.39893, -2.03296, 9.56611, 0.133102, -2.03296, 9.56611, -0.133103, -2.0272, 9.55317, -0.398931, -2.01569, 9.52732, -0.663628, -1.99847, 9.48863, -0.926444, -1.97558, 9.43723, -1.18663, -1.94709, 9.37324, -1.44346, -1.91309, 9.29686, -1.69619, -1.87366, 9.2083, -1.94412, -1.82892, 9.10781, -2.18654, -1.77899, 8.99568, -2.42275, -1.72402, 8.87222, -2.6521, -1.66417, 8.73778, -2.87394, -1.5996, 8.59275, -3.08762, -1.53049, 8.43754, -3.29256, -1.45705, 8.27258, -3.48816, -1.37947, 8.09834, -3.67387, -1.29799, 7.91533, -3.84917, -1.21282, 7.72404, -4.01356, -1.12422, 7.52504, -4.16657, -1.03243, 7.31888, -4.30777, -0.937716, 7.10614, -4.43676, -0.840343, 6.88744, -4.55317, -0.740587, 6.66339, -4.65668, -0.638732, 6.43462, -4.74699, -0.535067, 6.20178, -4.82384, -0.429885, 5.96554, -4.88702, -0.323485, 5.72656, -4.93634, -0.216167, 5.48552, -4.97167, -0.265734, 5.46026, 4.97167, -0.397659, 5.68877, 4.93634, -0.528457, 5.91531, 4.88702, -0.657757, 6.13927, 4.82384, -0.785192, 6.35999, 4.74699, -0.910402, 6.57686, 4.65668, -1.03303, 6.78926, 4.55317, -1.15273, 6.99659, 4.43676, -1.26916, 7.19826, 4.30777, -1.382, 7.39369, 4.16657, -1.49092, 7.58235, 4.01356, -1.59561, 7.76368, 3.84917, -1.69578, 7.93718, 3.67387, -1.79114, 8.10235, 3.48816, -1.88143, 8.25873, 3.29256, -1.96638, 8.40587, 3.08762, -2.04576, 8.54335, 2.87394, -2.11934, 8.6708, 2.6521, -2.18691, 8.78784, 2.42275, -2.24828, 8.89414, 2.18654, -2.30328, 8.9894, 1.94412, -2.35175, 9.07335, 1.69619, -2.39356, 9.14576, 1.44346, -2.42858, 9.20642, 1.18663, -2.45671, 9.25515, 0.926443, -2.47788, 9.29182, 0.663627, -2.49203, 9.31632, 0.39893, -2.49911, 9.32859, 0.133102, -2.49911, 9.32859, -0.133103, -2.49203, 9.31632, -0.398931, -2.47788, 9.29182, -0.663628, -2.45671, 9.25515, -0.926444, -2.42858, 9.20641, -1.18663, -2.39356, 9.14576, -1.44346, -2.35175, 9.07335, -1.69619, -2.30328, 8.9894, -1.94412, -2.24828, 8.89414, -2.18654, -2.18691, 8.78784, -2.42275, -2.11934, 8.6708, -2.6521, -2.04576, 8.54335, -2.87394, -1.96638, 8.40587, -3.08762, -1.88143, 8.25873, -3.29256, -1.79114, 8.10235, -3.48816, -1.69578, 7.93718, -3.67387, -1.59561, 7.76368, -3.84917, -1.49092, 7.58235, -4.01356, -1.382, 7.39369, -4.16657, -1.26916, 7.19826, -4.30777, -1.15273, 6.99659, -4.43676, -1.03303, 6.78926, -4.55317, -0.910401, 6.57686, -4.65668, -0.785192, 6.35999, -4.74699, -0.657756, 6.13927, -4.82384, -0.528456, 5.91531, -4.88702, -0.397659, 5.68876, -4.93634, -0.265734, 5.46026, -4.97167, -0.312389, 5.42997, 4.97167, -0.467476, 5.64343, 4.93634, -0.621238, 5.85506, 4.88702, -0.773239, 6.06427, 4.82384, -0.923048, 6.27047, 4.74699, -1.07024, 6.47306, 4.65668, -1.2144, 6.67148, 4.55317, -1.35512, 6.86516, 4.43676, -1.49199, 7.05355, 4.30777, -1.62464, 7.23612, 4.16657, -1.75268, 7.41236, 4.01356, -1.87575, 7.58175, 3.84917, -1.99351, 7.74383, 3.67387, -2.10561, 7.89813, 3.48816, -2.21175, 8.04421, 3.29256, -2.31162, 8.18167, 3.08762, -2.40493, 8.3101, 2.87394, -2.49143, 8.42916, 2.6521, -2.57086, 8.53849, 2.42275, -2.64301, 8.63779, 2.18654, -2.70767, 8.72678, 1.94412, -2.76465, 8.80521, 1.69619, -2.81379, 8.87285, 1.44346, -2.85496, 8.92952, 1.18663, -2.88804, 8.97504, 0.926443, -2.91293, 9.0093, 0.663627, -2.92956, 9.03219, 0.39893, -2.93789, 9.04365, 0.133102, -2.93789, 9.04365, -0.133103, -2.92956, 9.03219, -0.398931, -2.91293, 9.0093, -0.663628, -2.88804, 8.97504, -0.926444, -2.85496, 8.92952, -1.18663, -2.81379, 8.87285, -1.44346, -2.76465, 8.80521, -1.69619, -2.70767, 8.72678, -1.94412, -2.64301, 8.63779, -2.18654, -2.57086, 8.53849, -2.42275, -2.49143, 8.42916, -2.6521, -2.40493, 8.3101, -2.87394, -2.31162, 8.18167, -3.08762, -2.21175, 8.04421, -3.29256, -2.10561, 7.89813, -3.48816, -1.99351, 7.74383, -3.67387, -1.87575, 7.58175, -3.84917, -1.75268, 7.41236, -4.01356, -1.62464, 7.23612, -4.16657, -1.49199, 7.05355, -4.30777, -1.35512, 6.86516, -4.43676, -1.2144, 6.67148, -4.55317, -1.07024, 6.47306, -4.65668, -0.923048, 6.27047, -4.74699, -0.773239, 6.06427, -4.82384, -0.621238, 5.85506, -4.88702, -0.467476, 5.64342, -4.93634, -0.312389, 5.42997, -4.97167, -0.355621, 5.39496, 4.97167, -0.532171, 5.59104, 4.93634, -0.707213, 5.78544, 4.88702, -0.88025, 5.97762, 4.82384, -1.05079, 6.16702, 4.74699, -1.21836, 6.35312, 4.65668, -1.38246, 6.53538, 4.55317, -1.54266, 6.71329, 4.43676, -1.69847, 6.88635, 4.30777, -1.84948, 7.05405, 4.16657, -1.99524, 7.21594, 4.01356, -2.13534, 7.37154, 3.84917, -2.2694, 7.52042, 3.67387, -2.39702, 7.66216, 3.48816, -2.51784, 7.79635, 3.29256, -2.63153, 7.92261, 3.08762, -2.73776, 8.04059, 2.87394, -2.83623, 8.14995, 2.6521, -2.92665, 8.25038, 2.42275, -3.00879, 8.3416, 2.18654, -3.08239, 8.42334, 1.94412, -3.14726, 8.49538, 1.69619, -3.2032, 8.55752, 1.44346, -3.25007, 8.60957, 1.18663, -3.28772, 8.65138, 0.926443, -3.31605, 8.68285, 0.663627, -3.33499, 8.70388, 0.39893, -3.34447, 8.71441, 0.133102, -3.34447, 8.71441, -0.133103, -3.33499, 8.70388, -0.398931, -3.31605, 8.68285, -0.663628, -3.28772, 8.65138, -0.926444, -3.25007, 8.60956, -1.18663, -3.2032, 8.55752, -1.44346, -3.14726, 8.49538, -1.69619, -3.08239, 8.42334, -1.94412, -3.00879, 8.3416, -2.18654, -2.92665, 8.25038, -2.42275, -2.83623, 8.14995, -2.6521, -2.73776, 8.04059, -2.87394, -2.63153, 7.92261, -3.08762, -2.51784, 7.79635, -3.29256, -2.39702, 7.66216, -3.48816, -2.2694, 7.52042, -3.67387, -2.13534, 7.37154, -3.84917, -1.99524, 7.21594, -4.01356, -1.84948, 7.05405, -4.16657, -1.69847, 6.88635, -4.30777, -1.54266, 6.71329, -4.43676, -1.38246, 6.53538, -4.55317, -1.21835, 6.35312, -4.65668, -1.05079, 6.16702, -4.74699, -0.88025, 5.97762, -4.82384, -0.707213, 5.78544, -4.88702, -0.532171, 5.59104, -4.93634, -0.355621, 5.39496, -4.97167, -0.394957, 5.35562, 4.97167, -0.591036, 5.53217, 4.93634, -0.78544, 5.70721, 4.88702, -0.977617, 5.88025, 4.82384, -1.16702, 6.05079, 4.74699, -1.35312, 6.21835, 4.65668, -1.53538, 6.38246, 4.55317, -1.71329, 6.54266, 4.43676, -1.88635, 6.69847, 4.30777, -2.05405, 6.84948, 4.16657, -2.21594, 6.99524, 4.01356, -2.37154, 7.13534, 3.84917, -2.52042, 7.2694, 3.67387, -2.66216, 7.39702, 3.48816, -2.79635, 7.51784, 3.29256, -2.92261, 7.63153, 3.08762, -3.04059, 7.73776, 2.87394, -3.14995, 7.83623, 2.6521, -3.25038, 7.92665, 2.42275, -3.3416, 8.00879, 2.18654, -3.42334, 8.08239, 1.94412, -3.49538, 8.14726, 1.69619, -3.55752, 8.2032, 1.44346, -3.60957, 8.25007, 1.18663, -3.65138, 8.28772, 0.926443, -3.68285, 8.31605, 0.663627, -3.70388, 8.33499, 0.39893, -3.71441, 8.34447, 0.133102, -3.71441, 8.34447, -0.133103, -3.70388, 8.33499, -0.398931, -3.68285, 8.31605, -0.663628, -3.65138, 8.28772, -0.926444, -3.60957, 8.25007, -1.18663, -3.55752, 8.2032, -1.44346, -3.49538, 8.14726, -1.69619, -3.42334, 8.08239, -1.94412, -3.3416, 8.00879, -2.18654, -3.25038, 7.92665, -2.42275, -3.14995, 7.83623, -2.6521, -3.04059, 7.73776, -2.87394, -2.92261, 7.63153, -3.08762, -2.79635, 7.51784, -3.29256, -2.66216, 7.39702, -3.48816, -2.52042, 7.2694, -3.67387, -2.37154, 7.13534, -3.84917, -2.21594, 6.99524, -4.01356, -2.05405, 6.84948, -4.16657, -1.88635, 6.69847, -4.30777, -1.71329, 6.54265, -4.43676, -1.53538, 6.38246, -4.55317, -1.35312, 6.21835, -4.65668, -1.16702, 6.05079, -4.74699, -0.977616, 5.88025, -4.82384, -0.785439, 5.70721, -4.88702, -0.591036, 5.53217, -4.93634, -0.394957, 5.35562, -4.97167, -0.429966, 5.31239, 4.97167, -0.643425, 5.46748, 4.93634, -0.855061, 5.62124, 4.88702, -1.06427, 5.77324, 4.82384, -1.27047, 5.92305, 4.74699, -1.47306, 6.07024, 4.65668, -1.67148, 6.2144, 4.55317, -1.86516, 6.35512, 4.43676, -2.05355, 6.49199, 4.30777, -2.23612, 6.62464, 4.16657, -2.41236, 6.75268, 4.01356, -2.58175, 6.87575, 3.84917, -2.74383, 6.99351, 3.67387, -2.89813, 7.10561, 3.48816, -3.04421, 7.21175, 3.29256, -3.18167, 7.31162, 3.08762, -3.3101, 7.40493, 2.87394, -3.42916, 7.49143, 2.6521, -3.53849, 7.57086, 2.42275, -3.63779, 7.64301, 2.18654, -3.72679, 7.70767, 1.94412, -3.80521, 7.76465, 1.69619, -3.87285, 7.81379, 1.44346, -3.92952, 7.85496, 1.18663, -3.97504, 7.88804, 0.926443, -4.0093, 7.91292, 0.663627, -4.03219, 7.92956, 0.39893, -4.04365, 7.93788, 0.133102, -4.04365, 7.93788, -0.133103, -4.03219, 7.92956, -0.398931, -4.0093, 7.91292, -0.663628, -3.97504, 7.88804, -0.926444, -3.92952, 7.85496, -1.18663, -3.87285, 7.81379, -1.44346, -3.80521, 7.76465, -1.69619, -3.72679, 7.70767, -1.94412, -3.63779, 7.64301, -2.18654, -3.53849, 7.57086, -2.42275, -3.42916, 7.49143, -2.6521, -3.3101, 7.40493, -2.87394, -3.18167, 7.31162, -3.08762, -3.04421, 7.21175, -3.29256, -2.89813, 7.10561, -3.48816, -2.74383, 6.99351, -3.67387, -2.58175, 6.87575, -3.84917, -2.41236, 6.75268, -4.01356, -2.23612, 6.62464, -4.16657, -2.05355, 6.49199, -4.30777, -1.86516, 6.35512, -4.43676, -1.67148, 6.2144, -4.55317, -1.47306, 6.07024, -4.65668, -1.27047, 5.92305, -4.74699, -1.06427, 5.77324, -4.82384, -0.85506, 5.62124, -4.88702, -0.643425, 5.46748, -4.93634, -0.429966, 5.31239, -4.97167, -0.460264, 5.26573, 4.97167, -0.688765, 5.39766, 4.93634, -0.915314, 5.52846, 4.88702, -1.13927, 5.65776, 4.82384, -1.35999, 5.78519, 4.74699, -1.57686, 5.9104, 4.65668, -1.78926, 6.03303, 4.55317, -1.99659, 6.15273, 4.43676, -2.19826, 6.26916, 4.30777, -2.39369, 6.382, 4.16657, -2.58235, 6.49092, 4.01356, -2.76368, 6.59561, 3.84917, -2.93718, 6.69578, 3.67387, -3.10235, 6.79114, 3.48816, -3.25873, 6.88143, 3.29256, -3.40587, 6.96638, 3.08762, -3.54336, 7.04576, 2.87394, -3.6708, 7.11934, 2.6521, -3.78784, 7.18691, 2.42275, -3.89414, 7.24828, 2.18654, -3.9894, 7.30328, 1.94412, -4.07335, 7.35175, 1.69619, -4.14576, 7.39355, 1.44346, -4.20642, 7.42857, 1.18663, -4.25515, 7.45671, 0.926443, -4.29182, 7.47788, 0.663627, -4.31632, 7.49203, 0.39893, -4.32859, 7.49911, 0.133102, -4.32859, 7.49911, -0.133103, -4.31632, 7.49203, -0.398931, -4.29182, 7.47788, -0.663628, -4.25515, 7.45671, -0.926444, -4.20642, 7.42857, -1.18663, -4.14576, 7.39355, -1.44346, -4.07335, 7.35175, -1.69619, -3.9894, 7.30328, -1.94412, -3.89414, 7.24828, -2.18654, -3.78784, 7.18691, -2.42275, -3.6708, 7.11934, -2.6521, -3.54335, 7.04576, -2.87394, -3.40587, 6.96638, -3.08762, -3.25873, 6.88143, -3.29256, -3.10235, 6.79114, -3.48816, -2.93718, 6.69578, -3.67387, -2.76368, 6.59561, -3.84917, -2.58235, 6.49092, -4.01356, -2.39369, 6.382, -4.16657, -2.19826, 6.26916, -4.30777, -1.99659, 6.15273, -4.43676, -1.78926, 6.03303, -4.55317, -1.57686, 5.9104, -4.65668, -1.35999, 5.78519, -4.74699, -1.13927, 5.65776, -4.82384, -0.915313, 5.52846, -4.88702, -0.688765, 5.39766, -4.93634, -0.460264, 5.26573, -4.97167, -0.48552, 5.21617, 4.97167, -0.726559, 5.32348, 4.93634, -0.965538, 5.42989, 4.88702, -1.20178, 5.53507, 4.82384, -1.43462, 5.63873, 4.74699, -1.66339, 5.74059, 4.65668, -1.88744, 5.84034, 4.55317, -2.10614, 5.93772, 4.43676, -2.31888, 6.03243, 4.30777, -2.52504, 6.12422, 4.16657, -2.72404, 6.21282, 4.01356, -2.91533, 6.29799, 3.84917, -3.09834, 6.37947, 3.67387, -3.27258, 6.45705, 3.48816, -3.43754, 6.53049, 3.29256, -3.59275, 6.5996, 3.08762, -3.73778, 6.66417, 2.87394, -3.87222, 6.72402, 2.6521, -3.99568, 6.77899, 2.42275, -4.10781, 6.82892, 2.18654, -4.2083, 6.87366, 1.94412, -4.29686, 6.91309, 1.69619, -4.37324, 6.94709, 1.44346, -4.43723, 6.97558, 1.18663, -4.48863, 6.99847, 0.926443, -4.52732, 7.01569, 0.663627, -4.55317, 7.0272, 0.39893, -4.56611, 7.03296, 0.133102, -4.56611, 7.03296, -0.133103, -4.55317, 7.0272, -0.398931, -4.52732, 7.01569, -0.663628, -4.48863, 6.99847, -0.926444, -4.43723, 6.97558, -1.18663, -4.37324, 6.94709, -1.44346, -4.29686, 6.91309, -1.69619, -4.2083, 6.87366, -1.94412, -4.10781, 6.82892, -2.18654, -3.99568, 6.77899, -2.42275, -3.87222, 6.72402, -2.6521, -3.73778, 6.66417, -2.87394, -3.59275, 6.5996, -3.08762, -3.43754, 6.53049, -3.29256, -3.27258, 6.45705, -3.48816, -3.09834, 6.37947, -3.67387, -2.91533, 6.29799, -3.84917, -2.72404, 6.21282, -4.01356, -2.52504, 6.12422, -4.16657, -2.31888, 6.03243, -4.30777, -2.10614, 5.93772, -4.43676, -1.88744, 5.84034, -4.55317, -1.66339, 5.74059, -4.65668, -1.43462, 5.63873, -4.74699, -1.20178, 5.53507, -4.82384, -0.965538, 5.42988, -4.88702, -0.726558, 5.32348, -4.93634, -0.485519, 5.21617, -4.97167, -0.505456, 5.16423, 4.97167, -0.756392, 5.24577, 4.93634, -1.00518, 5.3266, 4.88702, -1.25113, 5.40652, 4.82384, -1.49352, 5.48528, 4.74699, -1.73169, 5.56266, 4.65668, -1.96494, 5.63845, 4.55317, -2.19263, 5.71243, 4.43676, -2.41409, 5.78439, 4.30777, -2.62872, 5.85412, 4.16657, -2.8359, 5.92144, 4.01356, -3.03503, 5.98614, 3.84917, -3.22556, 6.04805, 3.67387, -3.40695, 6.10699, 3.48816, -3.57869, 6.16279, 3.29256, -3.74028, 6.21529, 3.08762, -3.89126, 6.26435, 2.87394, -4.03122, 6.30982, 2.6521, -4.15975, 6.35158, 2.42275, -4.27648, 6.38951, 2.18654, -4.3811, 6.4235, 1.94412, -4.4733, 6.45346, 1.69619, -4.55281, 6.4793, 1.44346, -4.61942, 6.50094, 1.18663, -4.67294, 6.51833, 0.926443, -4.71321, 6.53141, 0.663627, -4.74012, 6.54016, 0.39893, -4.7536, 6.54454, 0.133102, -4.7536, 6.54454, -0.133103, -4.74012, 6.54016, -0.398931, -4.71321, 6.53141, -0.663628, -4.67294, 6.51833, -0.926444, -4.61942, 6.50094, -1.18663, -4.55281, 6.4793, -1.44346, -4.4733, 6.45346, -1.69619, -4.3811, 6.4235, -1.94412, -4.27648, 6.38951, -2.18654, -4.15975, 6.35158, -2.42275, -4.03122, 6.30982, -2.6521, -3.89126, 6.26435, -2.87394, -3.74027, 6.21529, -3.08762, -3.57869, 6.16279, -3.29256, -3.40695, 6.10699, -3.48816, -3.22556, 6.04805, -3.67387, -3.03503, 5.98614, -3.84917, -2.8359, 5.92144, -4.01356, -2.62872, 5.85412, -4.16657, -2.41409, 5.78439, -4.30777, -2.19262, 5.71243, -4.43676, -1.96494, 5.63845, -4.55317, -1.73169, 5.56266, -4.65668, -1.49352, 5.48527, -4.74699, -1.25113, 5.40652, -4.82384, -1.00518, 5.3266, -4.88702, -0.756392, 5.24577, -4.93634, -0.505455, 5.16423, -4.97167, -0.519854, 5.1105, 4.97167, -0.777938, 5.16536, 4.93634, -1.03382, 5.21974, 4.88702, -1.28677, 5.27351, 4.82384, -1.53607, 5.3265, 4.74699, -1.78101, 5.37857, 4.65668, -2.02091, 5.42956, 4.55317, -2.25508, 5.47933, 4.43676, -2.48286, 5.52775, 4.30777, -2.7036, 5.57467, 4.16657, -2.91668, 5.61996, 4.01356, -3.12149, 5.66349, 3.84917, -3.31745, 5.70514, 3.67387, -3.504, 5.7448, 3.48816, -3.68063, 5.78234, 3.29256, -3.84682, 5.81767, 3.08762, -4.0021, 5.85067, 2.87394, -4.14605, 5.88127, 2.6521, -4.27824, 5.90937, 2.42275, -4.3983, 5.93489, 2.18654, -4.5059, 5.95776, 1.94412, -4.60072, 5.97791, 1.69619, -4.6825, 5.9953, 1.44346, -4.75101, 6.00986, 1.18663, -4.80605, 6.02156, 0.926443, -4.84747, 6.03036, 0.663627, -4.87515, 6.03624, 0.39893, -4.889, 6.03919, 0.133102, -4.889, 6.03919, -0.133103, -4.87515, 6.03624, -0.398931, -4.84747, 6.03036, -0.663628, -4.80605, 6.02156, -0.926444, -4.75101, 6.00986, -1.18663, -4.6825, 5.9953, -1.44346, -4.60072, 5.97791, -1.69619, -4.5059, 5.95776, -1.94412, -4.3983, 5.93489, -2.18654, -4.27824, 5.90937, -2.42275, -4.14605, 5.88127, -2.6521, -4.0021, 5.85067, -2.87394, -3.84682, 5.81767, -3.08762, -3.68063, 5.78234, -3.29256, -3.504, 5.7448, -3.48816, -3.31745, 5.70514, -3.67387, -3.12148, 5.66349, -3.84917, -2.91668, 5.61996, -4.01356, -2.7036, 5.57467, -4.16657, -2.48286, 5.52775, -4.30777, -2.25508, 5.47933, -4.43676, -2.02091, 5.42956, -4.55317, -1.78101, 5.37857, -4.65668, -1.53607, 5.3265, -4.74699, -1.28677, 5.27351, -4.82384, -1.03382, 5.21974, -4.88702, -0.777937, 5.16536, -4.93634, -0.519853, 5.1105, -4.97167, -0.528556, 5.05555, 4.97167, -0.790961, 5.08313, 4.93634, -1.05112, 5.11048, 4.88702, -1.30831, 5.13751, 4.82384, -1.56178, 5.16415, 4.74699, -1.81083, 5.19033, 4.65668, -2.05474, 5.21596, 4.55317, -2.29283, 5.24099, 4.43676, -2.52442, 5.26533, 4.30777, -2.74886, 5.28892, 4.16657, -2.9655, 5.31169, 4.01356, -3.17374, 5.33357, 3.84917, -3.37298, 5.35451, 3.67387, -3.56266, 5.37445, 3.48816, -3.74224, 5.39332, 3.29256, -3.91121, 5.41108, 3.08762, -4.0691, 5.42768, 2.87394, -4.21545, 5.44306, 2.6521, -4.34986, 5.45719, 2.42275, -4.47193, 5.47002, 2.18654, -4.58132, 5.48152, 1.94412, -4.67774, 5.49165, 1.69619, -4.76089, 5.50039, 1.44346, -4.83054, 5.50771, 1.18663, -4.8865, 5.51359, 0.926443, -4.92862, 5.51802, 0.663627, -4.95676, 5.52098, 0.39893, -4.97085, 5.52246, 0.133102, -4.97085, 5.52246, -0.133103, -4.95676, 5.52098, -0.398931, -4.92862, 5.51802, -0.663628, -4.8865, 5.51359, -0.926444, -4.83054, 5.50771, -1.18663, -4.76089, 5.50039, -1.44346, -4.67773, 5.49165, -1.69619, -4.58132, 5.48152, -1.94412, -4.47193, 5.47002, -2.18654, -4.34985, 5.45719, -2.42275, -4.21545, 5.44306, -2.6521, -4.0691, 5.42768, -2.87394, -3.91121, 5.41108, -3.08762, -3.74224, 5.39332, -3.29256, -3.56266, 5.37445, -3.48816, -3.37298, 5.35451, -3.67387, -3.17374, 5.33357, -3.84917, -2.9655, 5.31169, -4.01356, -2.74886, 5.28892, -4.16657, -2.52442, 5.26533, -4.30777, -2.29283, 5.24099, -4.43676, -2.05474, 5.21596, -4.55317, -1.81083, 5.19033, -4.65668, -1.56178, 5.16415, -4.74699, -1.30831, 5.13751, -4.82384, -1.05112, 5.11048, -4.88702, -0.79096, 5.08313, -4.93634, -0.528556, 5.05555, -4.97167, -0.531467, 5.0, 4.97167, -0.795318, 5.0, 4.93634, -1.05691, 5.0, 4.88702, -1.31551, 5.0, 4.82384, -1.57038, 5.0, 4.74699, -1.8208, 5.0, 4.65668, -2.06606, 5.0, 4.55317, -2.30546, 5.0, 4.43676, -2.53833, 5.0, 4.30777, -2.764, 5.0, 4.16657, -2.98184, 5.0, 4.01356, -3.19122, 5.0, 3.84917, -3.39156, 5.0, 3.67387, -3.58228, 5.0, 3.48816, -3.76285, 5.0, 3.29256, -3.93276, 5.0, 3.08762, -4.09151, 5.0, 2.87394, -4.23867, 5.0, 2.6521, -4.37382, 5.0, 2.42275, -4.49656, 5.0, 2.18654, -4.60656, 5.0, 1.94412, -4.7035, 5.0, 1.69619, -4.78711, 5.0, 1.44346, -4.85715, 5.0, 1.18663, -4.91342, 5.0, 0.926443, -4.95576, 5.0, 0.663627, -4.98406, 5.0, 0.39893, -4.99823, 5.0, 0.133102, -4.99823, 5.0, -0.133103, -4.98406, 5.0, -0.398931, -4.95576, 5.0, -0.663628, -4.91342, 5.0, -0.926444, -4.85715, 5.0, -1.18663, -4.78711, 5.0, -1.44346, -4.7035, 5.0, -1.69619, -4.60656, 5.0, -1.94412, -4.49656, 5.0, -2.18654, -4.37382, 5.0, -2.42275, -4.23867, 5.0, -2.6521, -4.09151, 5.0, -2.87394, -3.93276, 5.0, -3.08762, -3.76285, 5.0, -3.29256, -3.58228, 5.0, -3.48816, -3.39156, 5.0, -3.67387, -3.19122, 5.0, -3.84917, -2.98184, 5.0, -4.01356, -2.764, 5.0, -4.16657, -2.53833, 5.0, -4.30777, -2.30546, 5.0, -4.43676, -2.06606, 5.0, -4.55317, -1.8208, 5.0, -4.65668, -1.57038, 5.0, -4.74699, -1.31551, 5.0, -4.82384, -1.05691, 5.0, -4.88702, -0.795317, 5.0, -4.93634, -0.531467, 5.0, -4.97167, -0.528556, 4.94445, 4.97167, -0.790961, 4.91687, 4.93634, -1.05112, 4.88952, 4.88702, -1.30831, 4.86249, 4.82384, -1.56178, 4.83585, 4.74699, -1.81083, 4.80967, 4.65668, -2.05474, 4.78404, 4.55317, -2.29283, 4.75901, 4.43676, -2.52442, 4.73467, 4.30777, -2.74886, 4.71108, 4.16657, -2.9655, 4.68831, 4.01356, -3.17374, 4.66643, 3.84917, -3.37298, 4.64549, 3.67387, -3.56266, 4.62555, 3.48816, -3.74224, 4.60667, 3.29256, -3.91121, 4.58891, 3.08762, -4.0691, 4.57232, 2.87394, -4.21545, 4.55694, 2.6521, -4.34986, 4.54281, 2.42275, -4.47193, 4.52998, 2.18654, -4.58132, 4.51848, 1.94412, -4.67773, 4.50835, 1.69619, -4.76089, 4.49961, 1.44346, -4.83054, 4.49229, 1.18663, -4.8865, 4.48641, 0.926443, -4.92862, 4.48198, 0.663627, -4.95676, 4.47902, 0.39893, -4.97085, 4.47754, 0.133102, -4.97085, 4.47754, -0.133103, -4.95676, 4.47902, -0.398931, -4.92862, 4.48198, -0.663628, -4.8865, 4.48641, -0.926444, -4.83054, 4.49229, -1.18663, -4.76089, 4.49961, -1.44346, -4.67773, 4.50835, -1.69619, -4.58132, 4.51848, -1.94412, -4.47193, 4.52998, -2.18654, -4.34985, 4.54281, -2.42275, -4.21545, 4.55694, -2.6521, -4.0691, 4.57232, -2.87394, -3.91121, 4.58891, -3.08762, -3.74224, 4.60667, -3.29256, -3.56266, 4.62555, -3.48816, -3.37298, 4.64549, -3.67387, -3.17374, 4.66643, -3.84917, -2.9655, 4.68831, -4.01356, -2.74886, 4.71108, -4.16657, -2.52442, 4.73467, -4.30777, -2.29283, 4.75901, -4.43676, -2.05474, 4.78404, -4.55317, -1.81083, 4.80967, -4.65668, -1.56178, 4.83585, -4.74699, -1.30831, 4.86249, -4.82384, -1.05112, 4.88952, -4.88702, -0.79096, 4.91687, -4.93634, -0.528556, 4.94445, -4.97167, -0.519854, 4.8895, 4.97167, -0.777938, 4.83464, 4.93634, -1.03382, 4.78026, 4.88702, -1.28677, 4.72649, 4.82384, -1.53607, 4.6735, 4.74699, -1.78101, 4.62143, 4.65668, -2.02091, 4.57044, 4.55317, -2.25508, 4.52067, 4.43676, -2.48286, 4.47225, 4.30777, -2.7036, 4.42533, 4.16657, -2.91668, 4.38004, 4.01356, -3.12148, 4.33651, 3.84917, -3.31745, 4.29485, 3.67387, -3.504, 4.2552, 3.48816, -3.68063, 4.21766, 3.29256, -3.84682, 4.18233, 3.08762, -4.0021, 4.14933, 2.87394, -4.14605, 4.11873, 2.6521, -4.27824, 4.09063, 2.42275, -4.3983, 4.06511, 2.18654, -4.5059, 4.04224, 1.94412, -4.60072, 4.02209, 1.69619, -4.6825, 4.0047, 1.44346, -4.75101, 3.99014, 1.18663, -4.80605, 3.97844, 0.926443, -4.84747, 3.96964, 0.663627, -4.87515, 3.96376, 0.39893, -4.889, 3.96081, 0.133102, -4.889, 3.96081, -0.133103, -4.87515, 3.96376, -0.398931, -4.84747, 3.96964, -0.663628, -4.80605, 3.97844, -0.926444, -4.75101, 3.99014, -1.18663, -4.6825, 4.0047, -1.44346, -4.60072, 4.02209, -1.69619, -4.5059, 4.04224, -1.94412, -4.3983, 4.06511, -2.18654, -4.27824, 4.09063, -2.42275, -4.14605, 4.11873, -2.6521, -4.0021, 4.14933, -2.87394, -3.84682, 4.18233, -3.08762, -3.68063, 4.21766, -3.29256, -3.504, 4.2552, -3.48816, -3.31745, 4.29486, -3.67387, -3.12148, 4.33651, -3.84917, -2.91668, 4.38004, -4.01356, -2.7036, 4.42533, -4.16657, -2.48286, 4.47225, -4.30777, -2.25508, 4.52067, -4.43676, -2.02091, 4.57044, -4.55317, -1.78101, 4.62143, -4.65668, -1.53607, 4.6735, -4.74699, -1.28677, 4.72649, -4.82384, -1.03382, 4.78026, -4.88702, -0.777937, 4.83464, -4.93634, -0.519853, 4.8895, -4.97167, -0.505456, 4.83577, 4.97167, -0.756392, 4.75423, 4.93634, -1.00518, 4.6734, 4.88702, -1.25113, 4.59348, 4.82384, -1.49352, 4.51472, 4.74699, -1.73169, 4.43734, 4.65668, -1.96494, 4.36155, 4.55317, -2.19263, 4.28757, 4.43676, -2.41409, 4.21561, 4.30777, -2.62872, 4.14588, 4.16657, -2.8359, 4.07856, 4.01356, -3.03503, 4.01386, 3.84917, -3.22556, 3.95195, 3.67387, -3.40695, 3.89301, 3.48816, -3.57869, 3.83721, 3.29256, -3.74027, 3.78471, 3.08762, -3.89126, 3.73565, 2.87394, -4.03122, 3.69018, 2.6521, -4.15975, 3.64842, 2.42275, -4.27648, 3.61049, 2.18654, -4.3811, 3.57649, 1.94412, -4.4733, 3.54654, 1.69619, -4.55281, 3.5207, 1.44346, -4.61942, 3.49906, 1.18663, -4.67294, 3.48167, 0.926443, -4.71321, 3.46858, 0.663627, -4.74012, 3.45984, 0.39893, -4.7536, 3.45546, 0.133102, -4.7536, 3.45546, -0.133103, -4.74012, 3.45984, -0.398931, -4.71321, 3.46858, -0.663628, -4.67294, 3.48167, -0.926444, -4.61942, 3.49906, -1.18663, -4.55281, 3.5207, -1.44346, -4.4733, 3.54654, -1.69619, -4.3811, 3.57649, -1.94412, -4.27648, 3.61049, -2.18654, -4.15975, 3.64842, -2.42275, -4.03122, 3.69018, -2.6521, -3.89126, 3.73565, -2.87394, -3.74027, 3.78471, -3.08762, -3.57869, 3.83721, -3.29256, -3.40695, 3.89301, -3.48816, -3.22556, 3.95195, -3.67387, -3.03503, 4.01386, -3.84917, -2.8359, 4.07856, -4.01356, -2.62872, 4.14588, -4.16657, -2.41409, 4.21561, -4.30777, -2.19262, 4.28757, -4.43676, -1.96494, 4.36155, -4.55317, -1.73169, 4.43734, -4.65668, -1.49352, 4.51472, -4.74699, -1.25113, 4.59348, -4.82384, -1.00518, 4.6734, -4.88702, -0.756391, 4.75423, -4.93634, -0.505455, 4.83577, -4.97167, -0.48552, 4.78383, 4.97167, -0.726559, 4.67652, 4.93634, -0.965538, 4.57011, 4.88702, -1.20178, 4.46493, 4.82384, -1.43462, 4.36127, 4.74699, -1.66339, 4.25941, 4.65668, -1.88744, 4.15966, 4.55317, -2.10614, 4.06228, 4.43676, -2.31888, 3.96757, 4.30777, -2.52504, 3.87578, 4.16657, -2.72404, 3.78718, 4.01356, -2.91533, 3.70201, 3.84917, -3.09834, 3.62053, 3.67387, -3.27258, 3.54295, 3.48816, -3.43754, 3.46951, 3.29256, -3.59275, 3.4004, 3.08762, -3.73778, 3.33583, 2.87394, -3.87222, 3.27598, 2.6521, -3.99568, 3.22101, 2.42275, -4.10781, 3.17108, 2.18654, -4.2083, 3.12634, 1.94412, -4.29686, 3.08691, 1.69619, -4.37324, 3.05291, 1.44346, -4.43723, 3.02442, 1.18663, -4.48863, 3.00153, 0.926443, -4.52732, 2.98431, 0.663627, -4.55317, 2.9728, 0.39893, -4.56611, 2.96704, 0.133102, -4.56611, 2.96704, -0.133103, -4.55316, 2.9728, -0.398931, -4.52732, 2.98431, -0.663628, -4.48863, 3.00153, -0.926444, -4.43723, 3.02442, -1.18663, -4.37324, 3.05291, -1.44346, -4.29686, 3.08691, -1.69619, -4.2083, 3.12634, -1.94412, -4.10781, 3.17108, -2.18654, -3.99568, 3.22101, -2.42275, -3.87222, 3.27598, -2.6521, -3.73778, 3.33583, -2.87394, -3.59275, 3.4004, -3.08762, -3.43754, 3.46951, -3.29256, -3.27258, 3.54295, -3.48816, -3.09834, 3.62053, -3.67387, -2.91532, 3.70201, -3.84917, -2.72404, 3.78718, -4.01356, -2.52504, 3.87578, -4.16657, -2.31888, 3.96757, -4.30777, -2.10614, 4.06228, -4.43676, -1.88744, 4.15966, -4.55317, -1.66339, 4.25941, -4.65668, -1.43462, 4.36127, -4.74699, -1.20178, 4.46493, -4.82384, -0.965538, 4.57011, -4.88702, -0.726558, 4.67652, -4.93634, -0.485519, 4.78383, -4.97167, -0.460264, 4.73427, 4.97167, -0.688765, 4.60234, 4.93634, -0.915314, 4.47154, 4.88702, -1.13927, 4.34224, 4.82384, -1.35999, 4.21481, 4.74699, -1.57686, 4.0896, 4.65668, -1.78926, 3.96697, 4.55317, -1.99659, 3.84727, 4.43676, -2.19826, 3.73084, 4.30777, -2.39369, 3.618, 4.16657, -2.58235, 3.50908, 4.01356, -2.76368, 3.40439, 3.84917, -2.93718, 3.30422, 3.67387, -3.10235, 3.20886, 3.48816, -3.25873, 3.11857, 3.29256, -3.40587, 3.03362, 3.08762, -3.54335, 2.95424, 2.87394, -3.6708, 2.88066, 2.6521, -3.78784, 2.81309, 2.42275, -3.89414, 2.75172, 2.18654, -3.9894, 2.69672, 1.94412, -4.07335, 2.64825, 1.69619, -4.14576, 2.60644, 1.44346, -4.20641, 2.57142, 1.18663, -4.25515, 2.54329, 0.926443, -4.29182, 2.52212, 0.663627, -4.31632, 2.50797, 0.39893, -4.32859, 2.50089, 0.133102, -4.32859, 2.50089, -0.133103, -4.31632, 2.50797, -0.398931, -4.29182, 2.52212, -0.663628, -4.25515, 2.54329, -0.926444, -4.20641, 2.57142, -1.18663, -4.14576, 2.60644, -1.44346, -4.07335, 2.64825, -1.69619, -3.9894, 2.69672, -1.94412, -3.89414, 2.75172, -2.18654, -3.78783, 2.81309, -2.42275, -3.6708, 2.88066, -2.6521, -3.54335, 2.95424, -2.87394, -3.40587, 3.03362, -3.08762, -3.25873, 3.11857, -3.29256, -3.10235, 3.20886, -3.48816, -2.93718, 3.30422, -3.67387, -2.76368, 3.40439, -3.84917, -2.58235, 3.50908, -4.01356, -2.39369, 3.618, -4.16657, -2.19826, 3.73084, -4.30777, -1.99659, 3.84727, -4.43676, -1.78926, 3.96697, -4.55317, -1.57686, 4.0896, -4.65668, -1.35999, 4.21481, -4.74699, -1.13927, 4.34224, -4.82384, -0.915313, 4.47154, -4.88702, -0.688765, 4.60234, -4.93634, -0.460264, 4.73427, -4.97167, -0.429966, 4.68761, 4.97167, -0.643425, 4.53252, 4.93634, -0.855061, 4.37876, 4.88702, -1.06427, 4.22676, 4.82384, -1.27047, 4.07695, 4.74699, -1.47306, 3.92976, 4.65668, -1.67148, 3.7856, 4.55317, -1.86516, 3.64488, 4.43676, -2.05355, 3.50801, 4.30777, -2.23612, 3.37536, 4.16657, -2.41236, 3.24732, 4.01356, -2.58175, 3.12425, 3.84917, -2.74383, 3.00649, 3.67387, -2.89813, 2.89439, 3.48816, -3.04421, 2.78825, 3.29256, -3.18167, 2.68838, 3.08762, -3.3101, 2.59507, 2.87394, -3.42916, 2.50857, 2.6521, -3.53849, 2.42914, 2.42275, -3.63779, 2.35699, 2.18654, -3.72678, 2.29233, 1.94412, -3.80521, 2.23535, 1.69619, -3.87285, 2.18621, 1.44346, -3.92952, 2.14504, 1.18663, -3.97504, 2.11196, 0.926443, -4.0093, 2.08707, 0.663627, -4.03219, 2.07044, 0.39893, -4.04365, 2.06211, 0.133102, -4.04365, 2.06211, -0.133103, -4.03219, 2.07044, -0.398931, -4.0093, 2.08707, -0.663628, -3.97504, 2.11196, -0.926444, -3.92952, 2.14504, -1.18663, -3.87285, 2.18621, -1.44346, -3.80521, 2.23535, -1.69619, -3.72678, 2.29233, -1.94412, -3.63779, 2.35699, -2.18654, -3.53849, 2.42914, -2.42275, -3.42916, 2.50857, -2.6521, -3.3101, 2.59507, -2.87394, -3.18167, 2.68838, -3.08762, -3.04421, 2.78825, -3.29256, -2.89813, 2.89439, -3.48816, -2.74383, 3.00649, -3.67387, -2.58175, 3.12425, -3.84917, -2.41236, 3.24732, -4.01356, -2.23612, 3.37536, -4.16657, -2.05355, 3.50801, -4.30777, -1.86516, 3.64488, -4.43676, -1.67148, 3.7856, -4.55317, -1.47306, 3.92976, -4.65668, -1.27047, 4.07695, -4.74699, -1.06427, 4.22676, -4.82384, -0.85506, 4.37876, -4.88702, -0.643425, 4.53252, -4.93634, -0.429966, 4.68761, -4.97167, -0.394957, 4.64438, 4.97167, -0.591036, 4.46783, 4.93634, -0.785439, 4.29279, 4.88702, -0.977616, 4.11975, 4.82384, -1.16702, 3.94921, 4.74699, -1.35312, 3.78164, 4.65668, -1.53538, 3.61754, 4.55317, -1.71329, 3.45734, 4.43676, -1.88635, 3.30153, 4.30777, -2.05405, 3.15052, 4.16657, -2.21594, 3.00476, 4.01356, -2.37154, 2.86466, 3.84917, -2.52042, 2.7306, 3.67387, -2.66216, 2.60298, 3.48816, -2.79635, 2.48216, 3.29256, -2.92261, 2.36847, 3.08762, -3.04059, 2.26224, 2.87394, -3.14995, 2.16377, 2.6521, -3.25038, 2.07335, 2.42275, -3.3416, 1.99121, 2.18654, -3.42334, 1.91761, 1.94412, -3.49538, 1.85274, 1.69619, -3.55752, 1.7968, 1.44346, -3.60957, 1.74993, 1.18663, -3.65138, 1.71228, 0.926443, -3.68285, 1.68395, 0.663627, -3.70388, 1.66501, 0.39893, -3.71441, 1.65553, 0.133102, -3.71441, 1.65553, -0.133103, -3.70388, 1.66501, -0.398931, -3.68285, 1.68395, -0.663628, -3.65138, 1.71228, -0.926444, -3.60957, 1.74993, -1.18663, -3.55752, 1.7968, -1.44346, -3.49538, 1.85274, -1.69619, -3.42334, 1.91761, -1.94412, -3.3416, 1.99121, -2.18654, -3.25038, 2.07335, -2.42275, -3.14995, 2.16377, -2.6521, -3.04059, 2.26224, -2.87394, -2.92261, 2.36847, -3.08762, -2.79634, 2.48216, -3.29256, -2.66216, 2.60298, -3.48816, -2.52042, 2.7306, -3.67387, -2.37154, 2.86466, -3.84917, -2.21594, 3.00476, -4.01356, -2.05405, 3.15052, -4.16657, -1.88635, 3.30153, -4.30777, -1.71329, 3.45734, -4.43676, -1.53538, 3.61754, -4.55317, -1.35312, 3.78165, -4.65668, -1.16702, 3.94921, -4.74699, -0.977616, 4.11975, -4.82384, -0.785439, 4.29279, -4.88702, -0.591036, 4.46783, -4.93634, -0.394957, 4.64438, -4.97167, -0.355621, 4.60504, 4.97167, -0.532171, 4.40896, 4.93634, -0.707213, 4.21456, 4.88702, -0.88025, 4.02238, 4.82384, -1.05079, 3.83298, 4.74699, -1.21835, 3.64688, 4.65668, -1.38246, 3.46462, 4.55317, -1.54266, 3.28671, 4.43676, -1.69847, 3.11365, 4.30777, -1.84948, 2.94595, 4.16657, -1.99524, 2.78406, 4.01356, -2.13534, 2.62846, 3.84917, -2.2694, 2.47958, 3.67387, -2.39702, 2.33784, 3.48816, -2.51784, 2.20365, 3.29256, -2.63153, 2.07739, 3.08762, -2.73776, 1.95941, 2.87394, -2.83623, 1.85005, 2.6521, -2.92665, 1.74962, 2.42275, -3.00879, 1.6584, 2.18654, -3.08239, 1.57666, 1.94412, -3.14726, 1.50462, 1.69619, -3.2032, 1.44248, 1.44346, -3.25007, 1.39043, 1.18663, -3.28772, 1.34862, 0.926443, -3.31605, 1.31715, 0.663627, -3.33499, 1.29612, 0.39893, -3.34447, 1.28559, 0.133102, -3.34447, 1.28559, -0.133103, -3.33499, 1.29612, -0.398931, -3.31605, 1.31715, -0.663628, -3.28772, 1.34862, -0.926444, -3.25007, 1.39043, -1.18663, -3.2032, 1.44248, -1.44346, -3.14726, 1.50462, -1.69619, -3.08239, 1.57666, -1.94412, -3.00879, 1.6584, -2.18654, -2.92665, 1.74962, -2.42275, -2.83622, 1.85005, -2.6521, -2.73776, 1.95941, -2.87394, -2.63153, 2.07739, -3.08762, -2.51784, 2.20365, -3.29256, -2.39702, 2.33784, -3.48816, -2.2694, 2.47958, -3.67387, -2.13534, 2.62846, -3.84917, -1.99524, 2.78406, -4.01356, -1.84948, 2.94595, -4.16657, -1.69847, 3.11365, -4.30777, -1.54266, 3.28671, -4.43676, -1.38246, 3.46462, -4.55317, -1.21835, 3.64688, -4.65668, -1.05079, 3.83298, -4.74699, -0.88025, 4.02238, -4.82384, -0.707213, 4.21456, -4.88702, -0.532171, 4.40896, -4.93634, -0.355621, 4.60504, -4.97167, -0.312389, 4.57003, 4.97167, -0.467476, 4.35657, 4.93634, -0.621238, 4.14494, 4.88702, -0.773239, 3.93573, 4.82384, -0.923048, 3.72953, 4.74699, -1.07024, 3.52694, 4.65668, -1.2144, 3.32852, 4.55317, -1.35512, 3.13484, 4.43676, -1.49199, 2.94645, 4.30777, -1.62464, 2.76388, 4.16657, -1.75268, 2.58764, 4.01356, -1.87575, 2.41825, 3.84917, -1.99351, 2.25617, 3.67387, -2.10561, 2.10187, 3.48816, -2.21175, 1.95579, 3.29256, -2.31162, 1.81833, 3.08762, -2.40493, 1.6899, 2.87394, -2.49143, 1.57084, 2.6521, -2.57086, 1.46151, 2.42275, -2.64301, 1.36221, 2.18654, -2.70767, 1.27321, 1.94412, -2.76465, 1.19479, 1.69619, -2.81379, 1.12715, 1.44346, -2.85496, 1.07048, 1.18663, -2.88804, 1.02496, 0.926443, -2.91292, 0.990702, 0.663627, -2.92956, 0.96781, 0.39893, -2.93788, 0.956348, 0.133102, -2.93788, 0.956348, -0.133103, -2.92956, 0.96781, -0.398931, -2.91292, 0.990702, -0.663628, -2.88804, 1.02496, -0.926444, -2.85496, 1.07048, -1.18663, -2.81379, 1.12715, -1.44346, -2.76465, 1.19479, -1.69619, -2.70767, 1.27321, -1.94412, -2.64301, 1.36221, -2.18654, -2.57086, 1.46151, -2.42275, -2.49143, 1.57084, -2.6521, -2.40493, 1.6899, -2.87394, -2.31162, 1.81833, -3.08762, -2.21175, 1.95579, -3.29256, -2.10561, 2.10187, -3.48816, -1.99351, 2.25617, -3.67387, -1.87575, 2.41825, -3.84917, -1.75268, 2.58764, -4.01356, -1.62464, 2.76388, -4.16657, -1.49199, 2.94645, -4.30777, -1.35512, 3.13484, -4.43676, -1.2144, 3.32852, -4.55317, -1.07024, 3.52694, -4.65668, -0.923048, 3.72953, -4.74699, -0.773239, 3.93573, -4.82384, -0.621238, 4.14494, -4.88702, -0.467476, 4.35658, -4.93634, -0.312388, 4.57003, -4.97167, -0.265734, 4.53974, 4.97167, -0.397659, 4.31123, 4.93634, -0.528456, 4.08469, 4.88702, -0.657756, 3.86073, 4.82384, -0.785192, 3.64001, 4.74699, -0.910401, 3.42314, 4.65668, -1.03303, 3.21074, 4.55317, -1.15273, 3.00341, 4.43676, -1.26916, 2.80174, 4.30777, -1.382, 2.60631, 4.16657, -1.49092, 2.41765, 4.01356, -1.59561, 2.23632, 3.84917, -1.69578, 2.06282, 3.67387, -1.79114, 1.89765, 3.48816, -1.88143, 1.74127, 3.29256, -1.96638, 1.59413, 3.08762, -2.04576, 1.45664, 2.87394, -2.11934, 1.3292, 2.6521, -2.18691, 1.21216, 2.42275, -2.24828, 1.10586, 2.18654, -2.30328, 1.0106, 1.94412, -2.35175, 0.926648, 1.69619, -2.39355, 0.854241, 1.44346, -2.42857, 0.793585, 1.18663, -2.45671, 0.744853, 0.926443, -2.47788, 0.708182, 0.663627, -2.49203, 0.683677, 0.39893, -2.49911, 0.671407, 0.133102, -2.49911, 0.671407, -0.133103, -2.49203, 0.683677, -0.398931, -2.47788, 0.708182, -0.663628, -2.45671, 0.744853, -0.926444, -2.42857, 0.793585, -1.18663, -2.39355, 0.854241, -1.44346, -2.35175, 0.926648, -1.69619, -2.30328, 1.0106, -1.94412, -2.24828, 1.10586, -2.18654, -2.18691, 1.21216, -2.42275, -2.11934, 1.3292, -2.6521, -2.04576, 1.45665, -2.87394, -1.96638, 1.59413, -3.08762, -1.88143, 1.74127, -3.29256, -1.79114, 1.89765, -3.48816, -1.69578, 2.06282, -3.67387, -1.59561, 2.23632, -3.84917, -1.49092, 2.41765, -4.01356, -1.382, 2.60631, -4.16657, -1.26916, 2.80174, -4.30777, -1.15273, 3.00341, -4.43676, -1.03303, 3.21074, -4.55317, -0.910401, 3.42314, -4.65668, -0.785191, 3.64001, -4.74699, -0.657756, 3.86073, -4.82384, -0.528456, 4.08469, -4.88702, -0.397658, 4.31123, -4.93634, -0.265733, 4.53974, -4.97167, -0.216167, 4.51448, 4.97167, -0.323485, 4.27344, 4.93634, -0.429885, 4.03446, 4.88702, -0.535067, 3.79822, 4.82384, -0.638732, 3.56538, 4.74699, -0.740587, 3.33661, 4.65668, -0.840342, 3.11256, 4.55317, -0.937716, 2.89386, 4.43676, -1.03243, 2.68112, 4.30777, -1.12422, 2.47496, 4.16657, -1.21282, 2.27596, 4.01356, -1.29799, 2.08467, 3.84917, -1.37947, 1.90166, 3.67387, -1.45705, 1.72742, 3.48816, -1.53049, 1.56246, 3.29256, -1.5996, 1.40725, 3.08762, -1.66417, 1.26222, 2.87394, -1.72402, 1.12778, 2.6521, -1.77899, 1.00432, 2.42275, -1.82892, 0.892187, 2.18654, -1.87366, 0.791698, 1.94412, -1.91309, 0.703137, 1.69619, -1.94709, 0.626757, 1.44346, -1.97558, 0.562773, 1.18663, -1.99847, 0.511367, 0.926443, -2.01569, 0.472684, 0.663627, -2.0272, 0.446834, 0.39893, -2.03296, 0.433891, 0.133102, -2.03296, 0.433891, -0.133103, -2.0272, 0.446834, -0.398931, -2.01569, 0.472684, -0.663628, -1.99847, 0.511367, -0.926444, -1.97558, 0.562773, -1.18663, -1.94709, 0.626757, -1.44346, -1.91309, 0.703138, -1.69619, -1.87366, 0.791698, -1.94412, -1.82892, 0.892187, -2.18654, -1.77899, 1.00432, -2.42275, -1.72402, 1.12778, -2.6521, -1.66417, 1.26222, -2.87394, -1.5996, 1.40725, -3.08762, -1.53049, 1.56246, -3.29256, -1.45705, 1.72742, -3.48816, -1.37947, 1.90166, -3.67387, -1.29799, 2.08467, -3.84917, -1.21282, 2.27596, -4.01356, -1.12422, 2.47496, -4.16657, -1.03243, 2.68112, -4.30777, -0.937716, 2.89386, -4.43676, -0.840342, 3.11256, -4.55317, -0.740587, 3.33661, -4.65668, -0.638732, 3.56538, -4.74699, -0.535067, 3.79822, -4.82384, -0.429885, 4.03446, -4.88702, -0.323485, 4.27344, -4.93634, -0.216167, 4.51448, -4.97167, -0.164232, 4.49454, 4.97167, -0.245767, 4.24361, 4.93634, -0.326604, 3.99482, 4.88702, -0.406516, 3.74887, 4.82384, -0.485275, 3.50648, 4.74699, -0.562659, 3.26831, 4.65668, -0.638448, 3.03506, 4.55317, -0.712427, 2.80737, 4.43676, -0.784387, 2.58591, 4.30777, -0.854123, 2.37128, 4.16657, -0.921438, 2.1641, 4.01356, -0.986141, 1.96497, 3.84917, -1.04805, 1.77444, 3.67387, -1.10699, 1.59305, 3.48816, -1.16279, 1.42131, 3.29256, -1.21529, 1.25972, 3.08762, -1.26435, 1.10874, 2.87394, -1.30982, 0.968783, 2.6521, -1.35158, 0.840254, 2.42275, -1.38951, 0.723516, 2.18654, -1.4235, 0.618901, 1.94412, -1.45346, 0.526704, 1.69619, -1.4793, 0.447187, 1.44346, -1.50094, 0.380576, 1.18663, -1.51833, 0.327059, 0.926443, -1.53141, 0.286788, 0.663627, -1.54016, 0.259877, 0.39893, -1.54454, 0.246402, 0.133102, -1.54454, 0.246402, -0.133103, -1.54016, 0.259877, -0.398931, -1.53141, 0.286788, -0.663628, -1.51833, 0.327059, -0.926444, -1.50094, 0.380576, -1.18663, -1.4793, 0.447188, -1.44346, -1.45346, 0.526704, -1.69619, -1.4235, 0.618901, -1.94412, -1.38951, 0.723517, -2.18654, -1.35158, 0.840254, -2.42275, -1.30982, 0.968783, -2.6521, -1.26435, 1.10874, -2.87394, -1.21529, 1.25973, -3.08762, -1.16279, 1.42131, -3.29256, -1.10699, 1.59305, -3.48816, -1.04805, 1.77444, -3.67387, -0.986141, 1.96497, -3.84917, -0.921438, 2.1641, -4.01356, -0.854123, 2.37128, -4.16657, -0.784386, 2.58591, -4.30777, -0.712427, 2.80738, -4.43676, -0.638448, 3.03506, -4.55317, -0.562659, 3.26831, -4.65668, -0.485275, 3.50648, -4.74699, -0.406516, 3.74887, -4.82384, -0.326604, 3.99482, -4.88702, -0.245766, 4.24361, -4.93634, -0.164232, 4.49454, -4.97167, -0.110498, 4.48015, 4.97167, -0.165356, 4.22206, 4.93634, -0.219744, 3.96618, 4.88702, -0.27351, 3.71323, 4.82384, -0.326501, 3.46393, 4.74699, -0.378566, 3.21899, 4.65668, -0.429558, 2.97909, 4.55317, -0.479332, 2.74492, 4.43676, -0.527748, 2.51714, 4.30777, -0.574668, 2.2964, 4.16657, -0.619958, 2.08332, 4.01356, -0.663492, 1.87851, 3.84917, -0.705144, 1.68255, 3.67387, -0.744798, 1.496, 3.48816, -0.782341, 1.31937, 3.29256, -0.817666, 1.15318, 3.08762, -0.850673, 0.997895, 2.87394, -0.881269, 0.853953, 2.6521, -0.909367, 0.721763, 2.42275, -0.934887, 0.6017, 2.18654, -0.957757, 0.494104, 1.94412, -0.977912, 0.399281, 1.69619, -0.995296, 0.317499, 1.44346, -1.00986, 0.248991, 1.18663, -1.02156, 0.193949, 0.926443, -1.03036, 0.152531, 0.663627, -1.03624, 0.124853, 0.39893, -1.03919, 0.110995, 0.133102, -1.03919, 0.110995, -0.133103, -1.03624, 0.124854, -0.398931, -1.03036, 0.152531, -0.663628, -1.02156, 0.193949, -0.926444, -1.00986, 0.248991, -1.18663, -0.995296, 0.3175, -1.44346, -0.977912, 0.399281, -1.69619, -0.957757, 0.494104, -1.94412, -0.934887, 0.6017, -2.18654, -0.909367, 0.721763, -2.42275, -0.881269, 0.853953, -2.6521, -0.850673, 0.997896, -2.87394, -0.817666, 1.15318, -3.08762, -0.782341, 1.31937, -3.29256, -0.744798, 1.496, -3.48816, -0.705144, 1.68255, -3.67387, -0.663492, 1.87852, -3.84917, -0.619958, 2.08332, -4.01356, -0.574668, 2.2964, -4.16657, -0.527748, 2.51714, -4.30777, -0.479332, 2.74492, -4.43676, -0.429558, 2.97909, -4.55317, -0.378566, 3.21899, -4.65668, -0.326501, 3.46393, -4.74699, -0.27351, 3.71323, -4.82384, -0.219744, 3.96618, -4.88702, -0.165356, 4.22206, -4.93634, -0.110498, 4.48015, -4.97167, -0.0555534, 4.47144, 4.97167, -0.0831332, 4.20904, 4.93634, -0.110477, 3.94888, 4.88702, -0.137508, 3.69169, 4.82384, -0.16415, 3.43822, 4.74699, -0.190325, 3.18917, 4.65668, -0.215962, 2.94526, 4.55317, -0.240986, 2.70717, 4.43676, -0.265327, 2.47558, 4.30777, -0.288916, 2.25114, 4.16657, -0.311686, 2.0345, 4.01356, -0.333573, 1.82626, 3.84917, -0.354514, 1.62702, 3.67387, -0.37445, 1.43734, 3.48816, -0.393325, 1.25776, 3.29256, -0.411085, 1.08879, 3.08762, -0.427679, 0.9309, 2.87394, -0.443061, 0.784548, 2.6521, -0.457188, 0.650145, 2.42275, -0.470018, 0.528072, 2.18654, -0.481516, 0.418675, 1.94412, -0.491649, 0.322265, 1.69619, -0.500389, 0.239114, 1.44346, -0.50771, 0.169458, 1.18663, -0.513592, 0.113496, 0.926443, -0.518018, 0.0713839, 0.663627, -0.520976, 0.0432431, 0.39893, -0.522456, 0.0291527, 0.133102, -0.522456, 0.0291527, -0.133103, -0.520975, 0.0432431, -0.398931, -0.518018, 0.071384, -0.663628, -0.513592, 0.113496, -0.926444, -0.50771, 0.169458, -1.18663, -0.500389, 0.239114, -1.44346, -0.491649, 0.322265, -1.69619, -0.481516, 0.418675, -1.94412, -0.470018, 0.528072, -2.18654, -0.457188, 0.650145, -2.42275, -0.443061, 0.784548, -2.6521, -0.427679, 0.9309, -2.87394, -0.411085, 1.08879, -3.08762, -0.393325, 1.25776, -3.29256, -0.37445, 1.43734, -3.48816, -0.354514, 1.62702, -3.67387, -0.333573, 1.82626, -3.84917, -0.311686, 2.0345, -4.01356, -0.288916, 2.25114, -4.16657, -0.265327, 2.47558, -4.30777, -0.240986, 2.70717, -4.43676, -0.215962, 2.94526, -4.55317, -0.190325, 3.18917, -4.65668, -0.16415, 3.43822, -4.74699, -0.137508, 3.69169, -4.82384, -0.110477, 3.94888, -4.88702, -0.0831332, 4.20904, -4.93634, -0.0555534, 4.47144, -4.97167, 6.96935e-08, 4.46853, 4.97167, 1.04293e-07, 4.20468, 4.93634, 1.38597e-07, 3.94309, 4.88702, 1.72509e-07, 3.68449, 4.82384, 2.05931e-07, 3.42962, 4.74699, 2.38769e-07, 3.1792, 4.65668, 2.70931e-07, 2.93394, 4.55317, 3.02325e-07, 2.69454, 4.43676, 3.32862e-07, 2.46167, 4.30777, 3.62455e-07, 2.236, 4.16657, 3.91021e-07, 2.01816, 4.01356, 4.18478e-07, 1.80878, 3.84917, 4.44749e-07, 1.60844, 3.67387, 4.6976e-07, 1.41772, 3.48816, 4.93439e-07, 1.23715, 3.29256, 5.15719e-07, 1.06724, 3.08762, 5.36537e-07, 0.908486, 2.87394, 5.55835e-07, 0.761328, 2.6521, 5.73557e-07, 0.626185, 2.42275, 5.89653e-07, 0.503439, 2.18654, 6.04077e-07, 0.39344, 1.94412, 6.1679e-07, 0.296499, 1.69619, 6.27754e-07, 0.21289, 1.44346, 6.36938e-07, 0.14285, 1.18663, 6.44317e-07, 0.0865793, 0.926443, 6.4987e-07, 0.0442358, 0.663627, 6.53581e-07, 0.0159399, 0.39893, 6.55438e-07, 0.00177194, 0.133102, 6.55438e-07, 0.00177195, -0.133103, 6.53581e-07, 0.01594, -0.398931, 6.4987e-07, 0.0442359, -0.663628, 6.44317e-07, 0.0865794, -0.926444, 6.36938e-07, 0.142851, -1.18663, 6.27754e-07, 0.21289, -1.44346, 6.1679e-07, 0.296499, -1.69619, 6.04077e-07, 0.39344, -1.94412, 5.89653e-07, 0.503439, -2.18654, 5.73557e-07, 0.626185, -2.42275, 5.55835e-07, 0.761328, -2.6521, 5.36537e-07, 0.908486, -2.87394, 5.15719e-07, 1.06724, -3.08762, 4.93439e-07, 1.23715, -3.29256, 4.6976e-07, 1.41772, -3.48816, 4.44749e-07, 1.60844, -3.67387, 4.18478e-07, 1.80878, -3.84917, 3.91021e-07, 2.01816, -4.01356, 3.62455e-07, 2.236, -4.16657, 3.32862e-07, 2.46167, -4.30777, 3.02325e-07, 2.69454, -4.43676, 2.70931e-07, 2.93394, -4.55317, 2.38769e-07, 3.1792, -4.65668, 2.05931e-07, 3.42962, -4.74699, 1.72509e-07, 3.68449, -4.82384, 1.38597e-07, 3.94309, -4.88702, 1.04293e-07, 4.20468, -4.93634, 6.96935e-08, 4.46853, -4.97167, 0.0555535, 4.47144, 4.97167, 0.0831334, 4.20904, 4.93634, 0.110478, 3.94888, 4.88702, 0.137509, 3.69169, 4.82384, 0.16415, 3.43822, 4.74699, 0.190326, 3.18917, 4.65668, 0.215962, 2.94526, 4.55317, 0.240987, 2.70717, 4.43676, 0.265328, 2.47558, 4.30777, 0.288917, 2.25114, 4.16657, 0.311687, 2.0345, 4.01356, 0.333574, 1.82626, 3.84917, 0.354515, 1.62702, 3.67387, 0.374451, 1.43734, 3.48816, 0.393326, 1.25776, 3.29256, 0.411086, 1.08879, 3.08762, 0.42768, 0.9309, 2.87394, 0.443062, 0.784548, 2.6521, 0.457189, 0.650145, 2.42275, 0.470019, 0.528072, 2.18654, 0.481517, 0.418675, 1.94412, 0.49165, 0.322265, 1.69619, 0.50039, 0.239114, 1.44346, 0.507711, 0.169459, 1.18663, 0.513593, 0.113496, 0.926443, 0.518019, 0.0713841, 0.663627, 0.520977, 0.0432432, 0.39893, 0.522458, 0.0291528, 0.133102, 0.522458, 0.0291528, -0.133103, 0.520977, 0.0432433, -0.398931, 0.518019, 0.0713841, -0.663628, 0.513593, 0.113496, -0.926444, 0.507711, 0.169459, -1.18663, 0.50039, 0.239114, -1.44346, 0.49165, 0.322265, -1.69619, 0.481517, 0.418676, -1.94412, 0.470019, 0.528072, -2.18654, 0.457189, 0.650145, -2.42275, 0.443062, 0.784548, -2.6521, 0.42768, 0.9309, -2.87394, 0.411086, 1.08879, -3.08762, 0.393326, 1.25776, -3.29256, 0.374451, 1.43734, -3.48816, 0.354515, 1.62702, -3.67387, 0.333574, 1.82626, -3.84917, 0.311687, 2.0345, -4.01356, 0.288917, 2.25114, -4.16657, 0.265328, 2.47558, -4.30777, 0.240987, 2.70717, -4.43676, 0.215962, 2.94526, -4.55317, 0.190326, 3.18917, -4.65668, 0.16415, 3.43822, -4.74699, 0.137509, 3.69169, -4.82384, 0.110478, 3.94888, -4.88702, 0.0831334, 4.20904, -4.93634, 0.0555535, 4.47144, -4.97167, 0.110498, 4.48015, 4.97167, 0.165356, 4.22206, 4.93634, 0.219745, 3.96618, 4.88702, 0.273511, 3.71323, 4.82384, 0.326501, 3.46393, 4.74699, 0.378566, 3.21899, 4.65668, 0.429559, 2.97909, 4.55317, 0.479333, 2.74492, 4.43676, 0.527749, 2.51714, 4.30777, 0.574668, 2.2964, 4.16657, 0.619959, 2.08332, 4.01356, 0.663493, 1.87851, 3.84917, 0.705145, 1.68255, 3.67387, 0.744799, 1.496, 3.48816, 0.782342, 1.31937, 3.29256, 0.817667, 1.15318, 3.08762, 0.850674, 0.997896, 2.87394, 0.88127, 0.853953, 2.6521, 0.909368, 0.721763, 2.42275, 0.934888, 0.6017, 2.18654, 0.957758, 0.494105, 1.94412, 0.977914, 0.399282, 1.69619, 0.995297, 0.3175, 1.44346, 1.00986, 0.248991, 1.18663, 1.02156, 0.19395, 0.926443, 1.03036, 0.152531, 0.663627, 1.03624, 0.124854, 0.39893, 1.03919, 0.110995, 0.133102, 1.03919, 0.110995, -0.133103, 1.03624, 0.124854, -0.398931, 1.03036, 0.152531, -0.663628, 1.02156, 0.19395, -0.926444, 1.00986, 0.248991, -1.18663, 0.995297, 0.3175, -1.44346, 0.977913, 0.399282, -1.69619, 0.957758, 0.494105, -1.94412, 0.934888, 0.6017, -2.18654, 0.909368, 0.721763, -2.42275, 0.88127, 0.853953, -2.6521, 0.850674, 0.997896, -2.87394, 0.817667, 1.15318, -3.08762, 0.782342, 1.31937, -3.29256, 0.744799, 1.496, -3.48816, 0.705145, 1.68255, -3.67387, 0.663493, 1.87852, -3.84917, 0.619959, 2.08332, -4.01356, 0.574668, 2.2964, -4.16657, 0.527749, 2.51714, -4.30777, 0.479333, 2.74492, -4.43676, 0.429558, 2.97909, -4.55317, 0.378566, 3.21899, -4.65668, 0.326501, 3.46393, -4.74699, 0.273511, 3.71323, -4.82384, 0.219745, 3.96618, -4.88702, 0.165356, 4.22206, -4.93634, 0.110498, 4.48015, -4.97167, 0.164233, 4.49454, 4.97167, 0.245767, 4.24361, 4.93634, 0.326604, 3.99482, 4.88702, 0.406516, 3.74887, 4.82384, 0.485275, 3.50648, 4.74699, 0.562659, 3.26831, 4.65668, 0.638448, 3.03506, 4.55317, 0.712427, 2.80737, 4.43676, 0.784387, 2.58591, 4.30777, 0.854123, 2.37128, 4.16657, 0.921439, 2.1641, 4.01356, 0.986142, 1.96497, 3.84917, 1.04805, 1.77444, 3.67387, 1.10699, 1.59305, 3.48816, 1.16279, 1.42131, 3.29256, 1.21529, 1.25973, 3.08762, 1.26435, 1.10874, 2.87394, 1.30982, 0.968783, 2.6521, 1.35158, 0.840254, 2.42275, 1.38951, 0.723517, 2.18654, 1.42351, 0.618901, 1.94412, 1.45346, 0.526705, 1.69619, 1.4793, 0.447188, 1.44346, 1.50094, 0.380577, 1.18663, 1.51833, 0.327059, 0.926443, 1.53142, 0.286788, 0.663627, 1.54016, 0.259877, 0.39893, 1.54454, 0.246403, 0.133102, 1.54454, 0.246403, -0.133103, 1.54016, 0.259877, -0.398931, 1.53142, 0.286788, -0.663628, 1.51833, 0.32706, -0.926444, 1.50094, 0.380577, -1.18663, 1.4793, 0.447188, -1.44346, 1.45346, 0.526705, -1.69619, 1.42351, 0.618901, -1.94412, 1.38951, 0.723517, -2.18654, 1.35158, 0.840255, -2.42275, 1.30982, 0.968784, -2.6521, 1.26435, 1.10874, -2.87394, 1.21529, 1.25973, -3.08762, 1.16279, 1.42131, -3.29256, 1.10699, 1.59305, -3.48816, 1.04805, 1.77444, -3.67387, 0.986142, 1.96497, -3.84917, 0.921439, 2.16411, -4.01356, 0.854123, 2.37128, -4.16657, 0.784387, 2.58591, -4.30777, 0.712427, 2.80738, -4.43676, 0.638448, 3.03506, -4.55317, 0.562659, 3.26831, -4.65668, 0.485275, 3.50648, -4.74699, 0.406516, 3.74887, -4.82384, 0.326604, 3.99482, -4.88702, 0.245767, 4.24361, -4.93634, 0.164232, 4.49454, -4.97167, 0.216167, 4.51448, 4.97167, 0.323485, 4.27344, 4.93634, 0.429885, 4.03446, 4.88702, 0.535067, 3.79822, 4.82384, 0.638733, 3.56538, 4.74699, 0.740588, 3.33661, 4.65668, 0.840343, 3.11256, 4.55317, 0.937716, 2.89386, 4.43676, 1.03243, 2.68112, 4.30777, 1.12422, 2.47496, 4.16657, 1.21282, 2.27596, 4.01356, 1.29799, 2.08467, 3.84917, 1.37947, 1.90166, 3.67387, 1.45705, 1.72742, 3.48816, 1.53049, 1.56246, 3.29256, 1.5996, 1.40725, 3.08762, 1.66417, 1.26222, 2.87394, 1.72402, 1.12778, 2.6521, 1.77899, 1.00432, 2.42275, 1.82892, 0.892188, 2.18654, 1.87366, 0.791698, 1.94412, 1.91309, 0.703138, 1.69619, 1.94709, 0.626757, 1.44346, 1.97558, 0.562773, 1.18663, 1.99847, 0.511367, 0.926443, 2.01569, 0.472684, 0.663627, 2.0272, 0.446835, 0.39893, 2.03296, 0.433892, 0.133102, 2.03296, 0.433892, -0.133103, 2.0272, 0.446835, -0.398931, 2.01569, 0.472684, -0.663628, 1.99847, 0.511367, -0.926444, 1.97558, 0.562774, -1.18663, 1.94709, 0.626758, -1.44346, 1.91309, 0.703138, -1.69619, 1.87366, 0.791699, -1.94412, 1.82892, 0.892188, -2.18654, 1.77899, 1.00432, -2.42275, 1.72402, 1.12778, -2.6521, 1.66417, 1.26222, -2.87394, 1.5996, 1.40725, -3.08762, 1.53049, 1.56246, -3.29256, 1.45705, 1.72742, -3.48816, 1.37947, 1.90166, -3.67387, 1.29799, 2.08468, -3.84917, 1.21282, 2.27596, -4.01356, 1.12422, 2.47496, -4.16657, 1.03243, 2.68112, -4.30777, 0.937716, 2.89386, -4.43676, 0.840343, 3.11256, -4.55317, 0.740587, 3.33661, -4.65668, 0.638733, 3.56538, -4.74699, 0.535067, 3.79822, -4.82384, 0.429885, 4.03446, -4.88702, 0.323485, 4.27344, -4.93634, 0.216167, 4.51448, -4.97167, 0.265734, 4.53974, 4.97167, 0.397659, 4.31123, 4.93634, 0.528457, 4.08469, 4.88702, 0.657757, 3.86073, 4.82384, 0.785192, 3.64001, 4.74699, 0.910402, 3.42314, 4.65668, 1.03303, 3.21074, 4.55317, 1.15273, 3.00341, 4.43676, 1.26916, 2.80174, 4.30777, 1.382, 2.60631, 4.16657, 1.49092, 2.41765, 4.01356, 1.59561, 2.23632, 3.84917, 1.69578, 2.06282, 3.67387, 1.79114, 1.89765, 3.48816, 1.88143, 1.74127, 3.29256, 1.96638, 1.59413, 3.08762, 2.04576, 1.45665, 2.87394, 2.11934, 1.3292, 2.6521, 2.18691, 1.21216, 2.42275, 2.24828, 1.10586, 2.18654, 2.30328, 1.0106, 1.94412, 2.35175, 0.926649, 1.69619, 2.39356, 0.854241, 1.44346, 2.42858, 0.793585, 1.18663, 2.45671, 0.744853, 0.926443, 2.47788, 0.708183, 0.663627, 2.49203, 0.683678, 0.39893, 2.49911, 0.671408, 0.133102, 2.49911, 0.671408, -0.133103, 2.49203, 0.683678, -0.398931, 2.47788, 0.708183, -0.663628, 2.45671, 0.744853, -0.926444, 2.42858, 0.793586, -1.18663, 2.39356, 0.854241, -1.44346, 2.35175, 0.926649, -1.69619, 2.30328, 1.0106, -1.94412, 2.24828, 1.10586, -2.18654, 2.18691, 1.21217, -2.42275, 2.11934, 1.3292, -2.6521, 2.04576, 1.45665, -2.87394, 1.96638, 1.59413, -3.08762, 1.88143, 1.74127, -3.29256, 1.79114, 1.89765, -3.48816, 1.69578, 2.06282, -3.67387, 1.59561, 2.23632, -3.84917, 1.49092, 2.41765, -4.01356, 1.382, 2.60631, -4.16657, 1.26916, 2.80174, -4.30777, 1.15273, 3.00341, -4.43676, 1.03303, 3.21074, -4.55317, 0.910401, 3.42314, -4.65668, 0.785192, 3.64001, -4.74699, 0.657756, 3.86073, -4.82384, 0.528457, 4.08469, -4.88702, 0.397659, 4.31124, -4.93634, 0.265734, 4.53974, -4.97167, 0.312389, 4.57003, 4.97167, 0.467476, 4.35657, 4.93634, 0.621238, 4.14494, 4.88702, 0.773239, 3.93573, 4.82384, 0.923048, 3.72953, 4.74699, 1.07024, 3.52694, 4.65668, 1.2144, 3.32852, 4.55317, 1.35512, 3.13484, 4.43676, 1.49199, 2.94645, 4.30777, 1.62464, 2.76388, 4.16657, 1.75268, 2.58764, 4.01356, 1.87575, 2.41825, 3.84917, 1.99351, 2.25617, 3.67387, 2.10561, 2.10187, 3.48816, 2.21175, 1.95579, 3.29256, 2.31162, 1.81833, 3.08762, 2.40493, 1.6899, 2.87394, 2.49143, 1.57084, 2.6521, 2.57086, 1.46151, 2.42275, 2.64301, 1.36221, 2.18654, 2.70767, 1.27322, 1.94412, 2.76465, 1.19479, 1.69619, 2.81379, 1.12715, 1.44346, 2.85496, 1.07048, 1.18663, 2.88804, 1.02496, 0.926443, 2.91293, 0.990703, 0.663627, 2.92956, 0.967811, 0.39893, 2.93789, 0.956349, 0.133102, 2.93789, 0.956349, -0.133103, 2.92956, 0.967811, -0.398931, 2.91293, 0.990703, -0.663628, 2.88804, 1.02496, -0.926444, 2.85496, 1.07048, -1.18663, 2.81379, 1.12715, -1.44346, 2.76465, 1.19479, -1.69619, 2.70767, 1.27322, -1.94412, 2.64301, 1.36221, -2.18654, 2.57086, 1.46151, -2.42275, 2.49143, 1.57084, -2.6521, 2.40493, 1.6899, -2.87394, 2.31162, 1.81833, -3.08762, 2.21175, 1.95579, -3.29256, 2.10561, 2.10187, -3.48816, 1.99351, 2.25617, -3.67387, 1.87575, 2.41825, -3.84917, 1.75268, 2.58764, -4.01356, 1.62464, 2.76388, -4.16657, 1.49199, 2.94645, -4.30777, 1.35512, 3.13484, -4.43676, 1.2144, 3.32852, -4.55317, 1.07024, 3.52694, -4.65668, 0.923048, 3.72953, -4.74699, 0.773239, 3.93573, -4.82384, 0.621238, 4.14494, -4.88702, 0.467476, 4.35658, -4.93634, 0.312389, 4.57003, -4.97167, 0.355621, 4.60504, 4.97167, 0.532171, 4.40896, 4.93634, 0.707213, 4.21456, 4.88702, 0.88025, 4.02238, 4.82384, 1.05079, 3.83298, 4.74699, 1.21836, 3.64688, 4.65668, 1.38246, 3.46462, 4.55317, 1.54266, 3.28671, 4.43676, 1.69847, 3.11365, 4.30777, 1.84948, 2.94595, 4.16657, 1.99524, 2.78406, 4.01356, 2.13534, 2.62846, 3.84917, 2.2694, 2.47958, 3.67387, 2.39702, 2.33784, 3.48816, 2.51784, 2.20366, 3.29256, 2.63153, 2.07739, 3.08762, 2.73776, 1.95941, 2.87394, 2.83623, 1.85005, 2.6521, 2.92665, 1.74962, 2.42275, 3.00879, 1.6584, 2.18654, 3.08239, 1.57666, 1.94412, 3.14726, 1.50462, 1.69619, 3.2032, 1.44248, 1.44346, 3.25007, 1.39043, 1.18663, 3.28772, 1.34862, 0.926443, 3.31605, 1.31715, 0.663627, 3.33499, 1.29612, 0.39893, 3.34447, 1.28559, 0.133102, 3.34447, 1.28559, -0.133103, 3.33499, 1.29612, -0.398931, 3.31605, 1.31715, -0.663628, 3.28772, 1.34862, -0.926444, 3.25007, 1.39044, -1.18663, 3.2032, 1.44248, -1.44346, 3.14726, 1.50462, -1.69619, 3.08239, 1.57666, -1.94412, 3.00879, 1.6584, -2.18654, 2.92665, 1.74962, -2.42275, 2.83623, 1.85005, -2.6521, 2.73776, 1.95941, -2.87394, 2.63153, 2.07739, -3.08762, 2.51784, 2.20366, -3.29256, 2.39702, 2.33784, -3.48816, 2.2694, 2.47958, -3.67387, 2.13534, 2.62846, -3.84917, 1.99524, 2.78406, -4.01356, 1.84948, 2.94595, -4.16657, 1.69847, 3.11365, -4.30777, 1.54266, 3.28671, -4.43676, 1.38246, 3.46462, -4.55317, 1.21835, 3.64688, -4.65668, 1.05079, 3.83298, -4.74699, 0.88025, 4.02238, -4.82384, 0.707213, 4.21456, -4.88702, 0.532171, 4.40896, -4.93634, 0.355621, 4.60504, -4.97167, 0.394957, 4.64438, 4.97167, 0.591036, 4.46783, 4.93634, 0.78544, 4.29279, 4.88702, 0.977617, 4.11975, 4.82384, 1.16702, 3.94921, 4.74699, 1.35312, 3.78165, 4.65668, 1.53538, 3.61754, 4.55317, 1.71329, 3.45734, 4.43676, 1.88635, 3.30153, 4.30777, 2.05405, 3.15052, 4.16657, 2.21594, 3.00476, 4.01356, 2.37154, 2.86466, 3.84917, 2.52042, 2.7306, 3.67387, 2.66216, 2.60298, 3.48816, 2.79635, 2.48216, 3.29256, 2.92261, 2.36847, 3.08762, 3.04059, 2.26224, 2.87394, 3.14995, 2.16378, 2.6521, 3.25038, 2.07335, 2.42275, 3.3416, 1.99121, 2.18654, 3.42334, 1.91761, 1.94412, 3.49538, 1.85274, 1.69619, 3.55752, 1.7968, 1.44346, 3.60957, 1.74993, 1.18663, 3.65138, 1.71228, 0.926443, 3.68285, 1.68395, 0.663627, 3.70388, 1.66501, 0.39893, 3.71441, 1.65553, 0.133102, 3.71441, 1.65553, -0.133103, 3.70388, 1.66501, -0.398931, 3.68285, 1.68395, -0.663628, 3.65138, 1.71228, -0.926444, 3.60957, 1.74993, -1.18663, 3.55752, 1.7968, -1.44346, 3.49538, 1.85274, -1.69619, 3.42334, 1.91761, -1.94412, 3.3416, 1.99121, -2.18654, 3.25038, 2.07335, -2.42275, 3.14995, 2.16378, -2.6521, 3.04059, 2.26224, -2.87394, 2.92261, 2.36847, -3.08762, 2.79635, 2.48216, -3.29256, 2.66216, 2.60298, -3.48816, 2.52042, 2.7306, -3.67387, 2.37154, 2.86466, -3.84917, 2.21594, 3.00476, -4.01356, 2.05405, 3.15052, -4.16657, 1.88635, 3.30153, -4.30777, 1.71329, 3.45735, -4.43676, 1.53538, 3.61754, -4.55317, 1.35312, 3.78165, -4.65668, 1.16702, 3.94921, -4.74699, 0.977616, 4.11975, -4.82384, 0.785439, 4.29279, -4.88702, 0.591036, 4.46783, -4.93634, 0.394957, 4.64438, -4.97167, 0.429966, 4.68761, 4.97167, 0.643425, 4.53252, 4.93634, 0.855061, 4.37876, 4.88702, 1.06427, 4.22676, 4.82384, 1.27047, 4.07695, 4.74699, 1.47306, 3.92976, 4.65668, 1.67148, 3.7856, 4.55317, 1.86516, 3.64488, 4.43676, 2.05355, 3.50801, 4.30777, 2.23612, 3.37536, 4.16657, 2.41236, 3.24732, 4.01356, 2.58175, 3.12425, 3.84917, 2.74383, 3.00649, 3.67387, 2.89813, 2.89439, 3.48816, 3.04421, 2.78825, 3.29256, 3.18167, 2.68838, 3.08762, 3.3101, 2.59507, 2.87394, 3.42916, 2.50857, 2.6521, 3.53849, 2.42914, 2.42275, 3.63779, 2.35699, 2.18654, 3.72679, 2.29233, 1.94412, 3.80521, 2.23535, 1.69619, 3.87285, 2.18621, 1.44346, 3.92952, 2.14504, 1.18663, 3.97504, 2.11196, 0.926443, 4.0093, 2.08708, 0.663627, 4.03219, 2.07044, 0.39893, 4.04365, 2.06212, 0.133102, 4.04365, 2.06212, -0.133103, 4.03219, 2.07044, -0.398931, 4.0093, 2.08708, -0.663628, 3.97504, 2.11196, -0.926444, 3.92952, 2.14504, -1.18663, 3.87285, 2.18621, -1.44346, 3.80521, 2.23535, -1.69619, 3.72679, 2.29233, -1.94412, 3.63779, 2.35699, -2.18654, 3.53849, 2.42914, -2.42275, 3.42916, 2.50857, -2.6521, 3.3101, 2.59507, -2.87394, 3.18167, 2.68838, -3.08762, 3.04421, 2.78825, -3.29256, 2.89813, 2.89439, -3.48816, 2.74383, 3.00649, -3.67387, 2.58175, 3.12425, -3.84917, 2.41236, 3.24732, -4.01356, 2.23612, 3.37536, -4.16657, 2.05355, 3.50801, -4.30777, 1.86516, 3.64488, -4.43676, 1.67148, 3.7856, -4.55317, 1.47306, 3.92976, -4.65668, 1.27047, 4.07695, -4.74699, 1.06427, 4.22676, -4.82384, 0.85506, 4.37876, -4.88702, 0.643425, 4.53252, -4.93634, 0.429966, 4.68761, -4.97167, 0.460264, 4.73427, 4.97167, 0.688765, 4.60234, 4.93634, 0.915314, 4.47154, 4.88702, 1.13927, 4.34224, 4.82384, 1.35999, 4.21481, 4.74699, 1.57686, 4.0896, 4.65668, 1.78926, 3.96697, 4.55317, 1.99659, 3.84727, 4.43676, 2.19826, 3.73084, 4.30777, 2.39369, 3.618, 4.16657, 2.58235, 3.50908, 4.01356, 2.76368, 3.40439, 3.84917, 2.93718, 3.30422, 3.67387, 3.10235, 3.20886, 3.48816, 3.25873, 3.11857, 3.29256, 3.40587, 3.03362, 3.08762, 3.54336, 2.95424, 2.87394, 3.6708, 2.88066, 2.6521, 3.78784, 2.81309, 2.42275, 3.89414, 2.75172, 2.18654, 3.9894, 2.69672, 1.94412, 4.07335, 2.64825, 1.69619, 4.14576, 2.60645, 1.44346, 4.20642, 2.57143, 1.18663, 4.25515, 2.54329, 0.926443, 4.29182, 2.52212, 0.663627, 4.31632, 2.50797, 0.39893, 4.32859, 2.50089, 0.133102, 4.32859, 2.50089, -0.133103, 4.31632, 2.50797, -0.398931, 4.29182, 2.52212, -0.663628, 4.25515, 2.54329, -0.926444, 4.20642, 2.57143, -1.18663, 4.14576, 2.60645, -1.44346, 4.07335, 2.64825, -1.69619, 3.9894, 2.69672, -1.94412, 3.89414, 2.75172, -2.18654, 3.78784, 2.81309, -2.42275, 3.6708, 2.88066, -2.6521, 3.54336, 2.95424, -2.87394, 3.40587, 3.03362, -3.08762, 3.25873, 3.11857, -3.29256, 3.10235, 3.20886, -3.48816, 2.93718, 3.30422, -3.67387, 2.76368, 3.40439, -3.84917, 2.58235, 3.50908, -4.01356, 2.39369, 3.618, -4.16657, 2.19826, 3.73084, -4.30777, 1.99659, 3.84727, -4.43676, 1.78926, 3.96697, -4.55317, 1.57686, 4.0896, -4.65668, 1.35999, 4.21481, -4.74699, 1.13927, 4.34224, -4.82384, 0.915313, 4.47154, -4.88702, 0.688765, 4.60234, -4.93634, 0.460264, 4.73427, -4.97167, 0.48552, 4.78383, 4.97167, 0.726559, 4.67652, 4.93634, 0.965538, 4.57012, 4.88702, 1.20178, 4.46493, 4.82384, 1.43462, 4.36127, 4.74699, 1.66339, 4.25941, 4.65668, 1.88744, 4.15966, 4.55317, 2.10614, 4.06228, 4.43676, 2.31888, 3.96757, 4.30777, 2.52504, 3.87578, 4.16657, 2.72404, 3.78718, 4.01356, 2.91533, 3.70201, 3.84917, 3.09834, 3.62053, 3.67387, 3.27258, 3.54295, 3.48816, 3.43754, 3.46951, 3.29256, 3.59275, 3.4004, 3.08762, 3.73778, 3.33583, 2.87394, 3.87222, 3.27598, 2.6521, 3.99568, 3.22101, 2.42275, 4.10781, 3.17108, 2.18654, 4.2083, 3.12634, 1.94412, 4.29686, 3.08691, 1.69619, 4.37324, 3.05291, 1.44346, 4.43723, 3.02442, 1.18663, 4.48863, 3.00153, 0.926443, 4.52732, 2.98431, 0.663627, 4.55317, 2.9728, 0.39893, 4.56611, 2.96704, 0.133102, 4.56611, 2.96704, -0.133103, 4.55317, 2.9728, -0.398931, 4.52732, 2.98431, -0.663628, 4.48863, 3.00153, -0.926444, 4.43723, 3.02442, -1.18663, 4.37324, 3.05291, -1.44346, 4.29686, 3.08691, -1.69619, 4.2083, 3.12634, -1.94412, 4.10781, 3.17108, -2.18654, 3.99568, 3.22101, -2.42275, 3.87222, 3.27598, -2.6521, 3.73778, 3.33583, -2.87394, 3.59275, 3.4004, -3.08762, 3.43754, 3.46951, -3.29256, 3.27258, 3.54295, -3.48816, 3.09834, 3.62053, -3.67387, 2.91533, 3.70201, -3.84917, 2.72404, 3.78718, -4.01356, 2.52504, 3.87578, -4.16657, 2.31888, 3.96757, -4.30777, 2.10614, 4.06228, -4.43676, 1.88744, 4.15966, -4.55317, 1.66339, 4.25941, -4.65668, 1.43462, 4.36127, -4.74699, 1.20178, 4.46493, -4.82384, 0.965538, 4.57012, -4.88702, 0.726558, 4.67652, -4.93634, 0.485519, 4.78383, -4.97167, 0.505456, 4.83577, 4.97167, 0.756392, 4.75423, 4.93634, 1.00518, 4.6734, 4.88702, 1.25113, 4.59348, 4.82384, 1.49352, 4.51473, 4.74699, 1.73169, 4.43734, 4.65668, 1.96494, 4.36155, 4.55317, 2.19263, 4.28757, 4.43676, 2.41409, 4.21561, 4.30777, 2.62872, 4.14588, 4.16657, 2.8359, 4.07856, 4.01356, 3.03503, 4.01386, 3.84917, 3.22556, 3.95195, 3.67387, 3.40695, 3.89301, 3.48816, 3.57869, 3.83721, 3.29256, 3.74028, 3.78471, 3.08762, 3.89126, 3.73565, 2.87394, 4.03122, 3.69018, 2.6521, 4.15975, 3.64842, 2.42275, 4.27648, 3.61049, 2.18654, 4.3811, 3.5765, 1.94412, 4.4733, 3.54654, 1.69619, 4.55281, 3.5207, 1.44346, 4.61942, 3.49906, 1.18663, 4.67294, 3.48167, 0.926443, 4.71321, 3.46859, 0.663627, 4.74012, 3.45984, 0.39893, 4.7536, 3.45546, 0.133102, 4.7536, 3.45546, -0.133103, 4.74012, 3.45984, -0.398931, 4.71321, 3.46859, -0.663628, 4.67294, 3.48167, -0.926444, 4.61942, 3.49906, -1.18663, 4.55281, 3.5207, -1.44346, 4.4733, 3.54654, -1.69619, 4.3811, 3.5765, -1.94412, 4.27648, 3.61049, -2.18654, 4.15975, 3.64842, -2.42275, 4.03122, 3.69018, -2.6521, 3.89126, 3.73565, -2.87394, 3.74027, 3.78471, -3.08762, 3.57869, 3.83721, -3.29256, 3.40695, 3.89301, -3.48816, 3.22556, 3.95195, -3.67387, 3.03503, 4.01386, -3.84917, 2.8359, 4.07856, -4.01356, 2.62872, 4.14588, -4.16657, 2.41409, 4.21561, -4.30777, 2.19263, 4.28757, -4.43676, 1.96494, 4.36155, -4.55317, 1.73169, 4.43734, -4.65668, 1.49352, 4.51473, -4.74699, 1.25113, 4.59348, -4.82384, 1.00518, 4.6734, -4.88702, 0.756392, 4.75423, -4.93634, 0.505455, 4.83577, -4.97167, 0.519854, 4.8895, 4.97167, 0.777938, 4.83464, 4.93634, 1.03382, 4.78026, 4.88702, 1.28677, 4.72649, 4.82384, 1.53607, 4.6735, 4.74699, 1.78101, 4.62143, 4.65668, 2.02091, 4.57044, 4.55317, 2.25508, 4.52067, 4.43676, 2.48286, 4.47225, 4.30777, 2.7036, 4.42533, 4.16657, 2.91668, 4.38004, 4.01356, 3.12149, 4.33651, 3.84917, 3.31745, 4.29486, 3.67387, 3.504, 4.2552, 3.48816, 3.68063, 4.21766, 3.29256, 3.84682, 4.18233, 3.08762, 4.0021, 4.14933, 2.87394, 4.14605, 4.11873, 2.6521, 4.27824, 4.09063, 2.42275, 4.3983, 4.06511, 2.18654, 4.5059, 4.04224, 1.94412, 4.60072, 4.02209, 1.69619, 4.6825, 4.0047, 1.44346, 4.75101, 3.99014, 1.18663, 4.80605, 3.97844, 0.926443, 4.84747, 3.96964, 0.663627, 4.87515, 3.96376, 0.39893, 4.88901, 3.96081, 0.133102, 4.88901, 3.96081, -0.133103, 4.87515, 3.96376, -0.398931, 4.84747, 3.96964, -0.663628, 4.80605, 3.97844, -0.926444, 4.75101, 3.99014, -1.18663, 4.6825, 4.0047, -1.44346, 4.60072, 4.02209, -1.69619, 4.5059, 4.04224, -1.94412, 4.3983, 4.06511, -2.18654, 4.27824, 4.09063, -2.42275, 4.14605, 4.11873, -2.6521, 4.0021, 4.14933, -2.87394, 3.84682, 4.18233, -3.08762, 3.68063, 4.21766, -3.29256, 3.504, 4.2552, -3.48816, 3.31745, 4.29486, -3.67387, 3.12148, 4.33651, -3.84917, 2.91668, 4.38004, -4.01356, 2.7036, 4.42533, -4.16657, 2.48286, 4.47225, -4.30777, 2.25508, 4.52067, -4.43676, 2.02091, 4.57044, -4.55317, 1.78101, 4.62143, -4.65668, 1.53607, 4.6735, -4.74699, 1.28677, 4.72649, -4.82384, 1.03382, 4.78026, -4.88702, 0.777938, 4.83464, -4.93634, 0.519853, 4.8895, -4.97167, 0.528556, 4.94445, 4.97167, 0.790961, 4.91687, 4.93634, 1.05112, 4.88952, 4.88702, 1.30831, 4.86249, 4.82384, 1.56178, 4.83585, 4.74699, 1.81083, 4.80967, 4.65668, 2.05474, 4.78404, 4.55317, 2.29283, 4.75901, 4.43676, 2.52442, 4.73467, 4.30777, 2.74886, 4.71108, 4.16657, 2.9655, 4.68831, 4.01356, 3.17374, 4.66643, 3.84917, 3.37298, 4.64549, 3.67387, 3.56266, 4.62555, 3.48816, 3.74224, 4.60668, 3.29256, 3.91121, 4.58892, 3.08762, 4.0691, 4.57232, 2.87394, 4.21545, 4.55694, 2.6521, 4.34986, 4.54281, 2.42275, 4.47193, 4.52998, 2.18654, 4.58133, 4.51848, 1.94412, 4.67774, 4.50835, 1.69619, 4.76089, 4.49961, 1.44346, 4.83054, 4.49229, 1.18663, 4.8865, 4.48641, 0.926443, 4.92862, 4.48198, 0.663627, 4.95676, 4.47902, 0.39893, 4.97085, 4.47754, 0.133102, 4.97085, 4.47754, -0.133103, 4.95676, 4.47902, -0.398931, 4.92862, 4.48198, -0.663628, 4.8865, 4.48641, -0.926444, 4.83054, 4.49229, -1.18663, 4.76089, 4.49961, -1.44346, 4.67773, 4.50835, -1.69619, 4.58132, 4.51848, -1.94412, 4.47193, 4.52998, -2.18654, 4.34985, 4.54281, -2.42275, 4.21545, 4.55694, -2.6521, 4.0691, 4.57232, -2.87394, 3.91121, 4.58892, -3.08762, 3.74224, 4.60668, -3.29256, 3.56266, 4.62555, -3.48816, 3.37298, 4.64549, -3.67387, 3.17374, 4.66643, -3.84917, 2.9655, 4.68831, -4.01356, 2.74886, 4.71108, -4.16657, 2.52442, 4.73467, -4.30777, 2.29283, 4.75901, -4.43676, 2.05474, 4.78404, -4.55317, 1.81083, 4.80967, -4.65668, 1.56178, 4.83585, -4.74699, 1.30831, 4.86249, -4.82384, 1.05112, 4.88952, -4.88702, 0.79096, 4.91687, -4.93634, 0.528556, 4.94445, -4.97167],
    "indices": [0, 1, 2, 1, 3, 2, 3, 4, 2, 4, 5, 2, 5, 6, 2, 6, 7, 2, 7, 8, 2, 8, 9, 2, 9, 10, 2, 10, 11, 2, 11, 12, 2, 12, 13, 2, 13, 14, 2, 14, 15, 2, 15, 16, 2, 16, 17, 2, 17, 18, 2, 18, 19, 2, 19, 20, 2, 20, 21, 2, 21, 22, 2, 22, 23, 2, 23, 24, 2, 24, 25, 2, 25, 26, 2, 26, 27, 2, 27, 28, 2, 28, 29, 2, 29, 30, 2, 30, 31, 2, 31, 32, 2, 32, 33, 2, 33, 34, 2, 34, 35, 2, 35, 36, 2, 36, 37, 2, 37, 38, 2, 38, 39, 2, 39, 40, 2, 40, 41, 2, 41, 42, 2, 42, 43, 2, 43, 44, 2, 44, 45, 2, 45, 46, 2, 46, 47, 2, 47, 48, 2, 48, 49, 2, 49, 50, 2, 50, 51, 2, 51, 52, 2, 52, 53, 2, 53, 54, 2, 54, 55, 2, 55, 56, 2, 56, 57, 2, 57, 58, 2, 58, 59, 2, 59, 60, 2, 60, 0, 2, 61, 62, 63, 63, 62, 64, 64, 62, 65, 65, 62, 66, 66, 62, 67, 67, 62, 68, 68, 62, 69, 69, 62, 70, 70, 62, 71, 71, 62, 72, 72, 62, 73, 73, 62, 74, 74, 62, 75, 75, 62, 76, 76, 62, 77, 77, 62, 78, 78, 62, 79, 79, 62, 80, 80, 62, 81, 81, 62, 82, 82, 62, 83, 83, 62, 84, 84, 62, 85, 85, 62, 86, 86, 62, 87, 87, 62, 88, 88, 62, 89, 89, 62, 90, 90, 62, 91, 91, 62, 92, 92, 62, 93, 93, 62, 94, 94, 62, 95, 95, 62, 96, 96, 62, 97, 97, 62, 98, 98, 62, 99, 99, 62, 100, 100, 62, 101, 101, 62, 102, 102, 62, 103, 103, 62, 104, 104, 62, 105, 105, 62, 106, 106, 62, 107, 107, 62, 108, 108, 62, 109, 109, 62, 110, 110, 62, 111, 111, 62, 112, 112, 62, 113, 113, 62, 114, 114, 62, 115, 115, 62, 116, 116, 62, 117, 117, 62, 118, 118, 62, 119, 119, 62, 120, 120, 62, 121, 121, 62, 61, 0, 122, 123, 0, 123, 1, 122, 124, 125, 122, 125, 123, 124, 126, 127, 124, 127, 125, 126, 128, 129, 126, 129, 127, 128, 130, 131, 128, 131, 129, 130, 132, 133, 130, 133, 131, 132, 134, 135, 132, 135, 133, 134, 136, 137, 134, 137, 135, 136, 138, 139, 136, 139, 137, 138, 140, 141, 138, 141, 139, 140, 142, 143, 140, 143, 141, 142, 144, 145, 142, 145, 143, 144, 146, 147, 144, 147, 145, 146, 148, 149, 146, 149, 147, 148, 150, 151, 148, 151, 149, 150, 152, 153, 150, 153, 151, 152, 154, 155, 152, 155, 153, 154, 156, 157, 154, 157, 155, 156, 158, 159, 156, 159, 157, 158, 160, 161, 158, 161, 159, 160, 162, 163, 160, 163, 161, 162, 164, 165, 162, 165, 163, 164, 166, 167, 164, 167, 165, 166, 168, 169, 166, 169, 167, 168, 170, 171, 168, 171, 169, 170, 172, 173, 170, 173, 171, 172, 174, 175, 172, 175, 173, 174, 176, 177, 174, 177, 175, 176, 178, 179, 176, 179, 177, 178, 180, 181, 178, 181, 179, 180, 182, 183, 180, 183, 181, 182, 184, 185, 182, 185, 183, 184, 186, 187, 184, 187, 185, 186, 188, 189, 186, 189, 187, 188, 190, 191, 188, 191, 189, 190, 192, 193, 190, 193, 191, 192, 194, 195, 192, 195, 193, 194, 196, 197, 194, 197, 195, 196, 198, 199, 196, 199, 197, 198, 200, 201, 198, 201, 199, 200, 202, 203, 200, 203, 201, 202, 204, 205, 202, 205, 203, 204, 206, 207, 204, 207, 205, 206, 208, 209, 206, 209, 207, 208, 210, 211, 208, 211, 209, 210, 212, 213, 210, 213, 211, 212, 214, 215, 212, 215, 213, 214, 216, 217, 214, 217, 215, 216, 218, 219, 216, 219, 217, 218, 220, 221, 218, 221, 219, 220, 222, 223, 220, 223, 221, 222, 224, 225, 222, 225, 223, 224, 226, 227, 224, 227, 225, 226, 228, 229, 226, 229, 227, 228, 230, 231, 228, 231, 229, 230, 232, 233, 230, 233, 231, 232, 61, 63, 232, 63, 233, 1, 123, 234, 1, 234, 3, 123, 125, 235, 123, 235, 234, 125, 127, 236, 125, 236, 235, 127, 129, 237, 127, 237, 236, 129, 131, 238, 129, 238, 237, 131, 133, 239, 131, 239, 238, 133, 135, 240, 133, 240, 239, 135, 137, 241, 135, 241, 240, 137, 139, 242, 137, 242, 241, 139, 141, 243, 139, 243, 242, 141, 143, 244, 141, 244, 243, 143, 145, 245, 143, 245, 244, 145, 147, 246, 145, 246, 245, 147, 149, 247, 147, 247, 246, 149, 151, 248, 149, 248, 247, 151, 153, 249, 151, 249, 248, 153, 155, 250, 153, 250, 249, 155, 157, 251, 155, 251, 250, 157, 159, 252, 157, 252, 251, 159, 161, 253, 159, 253, 252, 161, 163, 254, 161, 254, 253, 163, 165, 255, 163, 255, 254, 165, 167, 256, 165, 256, 255, 167, 169, 257, 167, 257, 256, 169, 171, 258, 169, 258, 257, 171, 173, 259, 171, 259, 258, 173, 175, 260, 173, 260, 259, 175, 177, 261, 175, 261, 260, 177, 179, 262, 177, 262, 261, 179, 181, 263, 179, 263, 262, 181, 183, 264, 181, 264, 263, 183, 185, 265, 183, 265, 264, 185, 187, 266, 185, 266, 265, 187, 189, 267, 187, 267, 266, 189, 191, 268, 189, 268, 267, 191, 193, 269, 191, 269, 268, 193, 195, 270, 193, 270, 269, 195, 197, 271, 195, 271, 270, 197, 199, 272, 197, 272, 271, 199, 201, 273, 199, 273, 272, 201, 203, 274, 201, 274, 273, 203, 205, 275, 203, 275, 274, 205, 207, 276, 205, 276, 275, 207, 209, 277, 207, 277, 276, 209, 211, 278, 209, 278, 277, 211, 213, 279, 211, 279, 278, 213, 215, 280, 213, 280, 279, 215, 217, 281, 215, 281, 280, 217, 219, 282, 217, 282, 281, 219, 221, 283, 219, 283, 282, 221, 223, 284, 221, 284, 283, 223, 225, 285, 223, 285, 284, 225, 227, 286, 225, 286, 285, 227, 229, 287, 227, 287, 286, 229, 231, 288, 229, 288, 287, 231, 233, 289, 231, 289, 288, 233, 63, 64, 233, 64, 289, 3, 234, 290, 3, 290, 4, 234, 235, 291, 234, 291, 290, 235, 236, 292, 235, 292, 291, 236, 237, 293, 236, 293, 292, 237, 238, 294, 237, 294, 293, 238, 239, 295, 238, 295, 294, 239, 240, 296, 239, 296, 295, 240, 241, 297, 240, 297, 296, 241, 242, 298, 241, 298, 297, 242, 243, 299, 242, 299, 298, 243, 244, 300, 243, 300, 299, 244, 245, 301, 244, 301, 300, 245, 246, 302, 245, 302, 301, 246, 247, 303, 246, 303, 302, 247, 248, 304, 247, 304, 303, 248, 249, 305, 248, 305, 304, 249, 250, 306, 249, 306, 305, 250, 251, 307, 250, 307, 306, 251, 252, 308, 251, 308, 307, 252, 253, 309, 252, 309, 308, 253, 254, 310, 253, 310, 309, 254, 255, 311, 254, 311, 310, 255, 256, 312, 255, 312, 311, 256, 257, 313, 256, 313, 312, 257, 258, 314, 257, 314, 313, 258, 259, 315, 258, 315, 314, 259, 260, 316, 259, 316, 315, 260, 261, 317, 260, 317, 316, 261, 262, 318, 261, 318, 317, 262, 263, 319, 262, 319, 318, 263, 264, 320, 263, 320, 319, 264, 265, 321, 264, 321, 320, 265, 266, 322, 265, 322, 321, 266, 267, 323, 266, 323, 322, 267, 268, 324, 267, 324, 323, 268, 269, 325, 268, 325, 324, 269, 270, 326, 269, 326, 325, 270, 271, 327, 270, 327, 326, 271, 272, 328, 271, 328, 327, 272, 273, 329, 272, 329, 328, 273, 274, 330, 273, 330, 329, 274, 275, 331, 274, 331, 330, 275, 276, 332, 275, 332, 331, 276, 277, 333, 276, 333, 332, 277, 278, 334, 277, 334, 333, 278, 279, 335, 278, 335, 334, 279, 280, 336, 279, 336, 335, 280, 281, 337, 280, 337, 336, 281, 282, 338, 281, 338, 337, 282, 283, 339, 282, 339, 338, 283, 284, 340, 283, 340, 339, 284, 285, 341, 284, 341, 340, 285, 286, 342, 285, 342, 341, 286, 287, 343, 286, 343, 342, 287, 288, 344, 287, 344, 343, 288, 289, 345, 288, 345, 344, 289, 64, 65, 289, 65, 345, 4, 290, 346, 4, 346, 5, 290, 291, 347, 290, 347, 346, 291, 292, 348, 291, 348, 347, 292, 293, 349, 292, 349, 348, 293, 294, 350, 293, 350, 349, 294, 295, 351, 294, 351, 350, 295, 296, 352, 295, 352, 351, 296, 297, 353, 296, 353, 352, 297, 298, 354, 297, 354, 353, 298, 299, 355, 298, 355, 354, 299, 300, 356, 299, 356, 355, 300, 301, 357, 300, 357, 356, 301, 302, 358, 301, 358, 357, 302, 303, 359, 302, 359, 358, 303, 304, 360, 303, 360, 359, 304, 305, 361, 304, 361, 360, 305, 306, 362, 305, 362, 361, 306, 307, 363, 306, 363, 362, 307, 308, 364, 307, 364, 363, 308, 309, 365, 308, 365, 364, 309, 310, 366, 309, 366, 365, 310, 311, 367, 310, 367, 366, 311, 312, 368, 311, 368, 367, 312, 313, 369, 312, 369, 368, 313, 314, 370, 313, 370, 369, 314, 315, 371, 314, 371, 370, 315, 316, 372, 315, 372, 371, 316, 317, 373, 316, 373, 372, 317, 318, 374, 317, 374, 373, 318, 319, 375, 318, 375, 374, 319, 320, 376, 319, 376, 375, 320, 321, 377, 320, 377, 376, 321, 322, 378, 321, 378, 377, 322, 323, 379, 322, 379, 378, 323, 324, 380, 323, 380, 379, 324, 325, 381, 324, 381, 380, 325, 326, 382, 325, 382, 381, 326, 327, 383, 326, 383, 382, 327, 328, 384, 327, 384, 383, 328, 329, 385, 328, 385, 384, 329, 330, 386, 329, 386, 385, 330, 331, 387, 330, 387, 386, 331, 332, 388, 331, 388, 387, 332, 333, 389, 332, 389, 388, 333, 334, 390, 333, 390, 389, 334, 335, 391, 334, 391, 390, 335, 336, 392, 335, 392, 391, 336, 337, 393, 336, 393, 392, 337, 338, 394, 337, 394, 393, 338, 339, 395, 338, 395, 394, 339, 340, 396, 339, 396, 395, 340, 341, 397, 340, 397, 396, 341, 342, 398, 341, 398, 397, 342, 343, 399, 342, 399, 398, 343, 344, 400, 343, 400, 399, 344, 345, 401, 344, 401, 400, 345, 65, 66, 345, 66, 401, 5, 346, 402, 5, 402, 6, 346, 347, 403, 346, 403, 402, 347, 348, 404, 347, 404, 403, 348, 349, 405, 348, 405, 404, 349, 350, 406, 349, 406, 405, 350, 351, 407, 350, 407, 406, 351, 352, 408, 351, 408, 407, 352, 353, 409, 352, 409, 408, 353, 354, 410, 353, 410, 409, 354, 355, 411, 354, 411, 410, 355, 356, 412, 355, 412, 411, 356, 357, 413, 356, 413, 412, 357, 358, 414, 357, 414, 413, 358, 359, 415, 358, 415, 414, 359, 360, 416, 359, 416, 415, 360, 361, 417, 360, 417, 416, 361, 362, 418, 361, 418, 417, 362, 363, 419, 362, 419, 418, 363, 364, 420, 363, 420, 419, 364, 365, 421, 364, 421, 420, 365, 366, 422, 365, 422, 421, 366, 367, 423, 366, 423, 422, 367, 368, 424, 367, 424, 423, 368, 369, 425, 368, 425, 424, 369, 370, 426, 369, 426, 425, 370, 371, 427, 370, 427, 426, 371, 372, 428, 371, 428, 427, 372, 373, 429, 372, 429, 428, 373, 374, 430, 373, 430, 429, 374, 375, 431, 374, 431, 430, 375, 376, 432, 375, 432, 431, 376, 377, 433, 376, 433, 432, 377, 378, 434, 377, 434, 433, 378, 379, 435, 378, 435, 434, 379, 380, 436, 379, 436, 435, 380, 381, 437, 380, 437, 436, 381, 382, 438, 381, 438, 437, 382, 383, 439, 382, 439, 438, 383, 384, 440, 383, 440, 439, 384, 385, 441, 384, 441, 440, 385, 386, 442, 385, 442, 441, 386, 387, 443, 386, 443, 442, 387, 388, 444, 387, 444, 443, 388, 389, 445, 388, 445, 444, 389, 390, 446, 389, 446, 445, 390, 391, 447, 390, 447, 446, 391, 392, 448, 391, 448, 447, 392, 393, 449, 392, 449, 448, 393, 394, 450, 393, 450, 449, 394, 395, 451, 394, 451, 450, 395, 396, 452, 395, 452, 451, 396, 397, 453, 396, 453, 452, 397, 398, 454, 397, 454, 453, 398, 399, 455, 398, 455, 454, 399, 400, 456, 399, 456, 455, 400, 401, 457, 400, 457, 456, 401, 66, 67, 401, 67, 457, 6, 402, 458, 6, 458, 7, 402, 403, 459, 402, 459, 458, 403, 404, 460, 403, 460, 459, 404, 405, 461, 404, 461, 460, 405, 406, 462, 405, 462, 461, 406, 407, 463, 406, 463, 462, 407, 408, 464, 407, 464, 463, 408, 409, 465, 408, 465, 464, 409, 410, 466, 409, 466, 465, 410, 411, 467, 410, 467, 466, 411, 412, 468, 411, 468, 467, 412, 413, 469, 412, 469, 468, 413, 414, 470, 413, 470, 469, 414, 415, 471, 414, 471, 470, 415, 416, 472, 415, 472, 471, 416, 417, 473, 416, 473, 472, 417, 418, 474, 417, 474, 473, 418, 419, 475, 418, 475, 474, 419, 420, 476, 419, 476, 475, 420, 421, 477, 420, 477, 476, 421, 422, 478, 421, 478, 477, 422, 423, 479, 422, 479, 478, 423, 424, 480, 423, 480, 479, 424, 425, 481, 424, 481, 480, 425, 426, 482, 425, 482, 481, 426, 427, 483, 426, 483, 482, 427, 428, 484, 427, 484, 483, 428, 429, 485, 428, 485, 484, 429, 430, 486, 429, 486, 485, 430, 431, 487, 430, 487, 486, 431, 432, 488, 431, 488, 487, 432, 433, 489, 432, 489, 488, 433, 434, 490, 433, 490, 489, 434, 435, 491, 434, 491, 490, 435, 436, 492, 435, 492, 491, 436, 437, 493, 436, 493, 492, 437, 438, 494, 437, 494, 493, 438, 439, 495, 438, 495, 494, 439, 440, 496, 439, 496, 495, 440, 441, 497, 440, 497, 496, 441, 442, 498, 441, 498, 497, 442, 443, 499, 442, 499, 498, 443, 444, 500, 443, 500, 499, 444, 445, 501, 444, 501, 500, 445, 446, 502, 445, 502, 501, 446, 447, 503, 446, 503, 502, 447, 448, 504, 447, 504, 503, 448, 449, 505, 448, 505, 504, 449, 450, 506, 449, 506, 505, 450, 451, 507, 450, 507, 506, 451, 452, 508, 451, 508, 507, 452, 453, 509, 452, 509, 508, 453, 454, 510, 453, 510, 509, 454, 455, 511, 454, 511, 510, 455, 456, 512, 455, 512, 511, 456, 457, 513, 456, 513, 512, 457, 67, 68, 457, 68, 513, 7, 458, 514, 7, 514, 8, 458, 459, 515, 458, 515, 514, 459, 460, 516, 459, 516, 515, 460, 461, 517, 460, 517, 516, 461, 462, 518, 461, 518, 517, 462, 463, 519, 462, 519, 518, 463, 464, 520, 463, 520, 519, 464, 465, 521, 464, 521, 520, 465, 466, 522, 465, 522, 521, 466, 467, 523, 466, 523, 522, 467, 468, 524, 467, 524, 523, 468, 469, 525, 468, 525, 524, 469, 470, 526, 469, 526, 525, 470, 471, 527, 470, 527, 526, 471, 472, 528, 471, 528, 527, 472, 473, 529, 472, 529, 528, 473, 474, 530, 473, 530, 529, 474, 475, 531, 474, 531, 530, 475, 476, 532, 475, 532, 531, 476, 477, 533, 476, 533, 532, 477, 478, 534, 477, 534, 533, 478, 479, 535, 478, 535, 534, 479, 480, 536, 479, 536, 535, 480, 481, 537, 480, 537, 536, 481, 482, 538, 481, 538, 537, 482, 483, 539, 482, 539, 538, 483, 484, 540, 483, 540, 539, 484, 485, 541, 484, 541, 540, 485, 486, 542, 485, 542, 541, 486, 487, 543, 486, 543, 542, 487, 488, 544, 487, 544, 543, 488, 489, 545, 488, 545, 544, 489, 490, 546, 489, 546, 545, 490, 491, 547, 490, 547, 546, 491, 492, 548, 491, 548, 547, 492, 493, 549, 492, 549, 548, 493, 494, 550, 493, 550, 549, 494, 495, 551, 494, 551, 550, 495, 496, 552, 495, 552, 551, 496, 497, 553, 496, 553, 552, 497, 498, 554, 497, 554, 553, 498, 499, 555, 498, 555, 554, 499, 500, 556, 499, 556, 555, 500, 501, 557, 500, 557, 556, 501, 502, 558, 501, 558, 557, 502, 503, 559, 502, 559, 558, 503, 504, 560, 503, 560, 559, 504, 505, 561, 504, 561, 560, 505, 506, 562, 505, 562, 561, 506, 507, 563, 506, 563, 562, 507, 508, 564, 507, 564, 563, 508, 509, 565, 508, 565, 564, 509, 510, 566, 509, 566, 565, 510, 511, 567, 510, 567, 566, 511, 512, 568, 511, 568, 567, 512, 513, 569, 512, 569, 568, 513, 68, 69, 513, 69, 569, 8, 514, 570, 8, 570, 9, 514, 515, 571, 514, 571, 570, 515, 516, 572, 515, 572, 571, 516, 517, 573, 516, 573, 572, 517, 518, 574, 517, 574, 573, 518, 519, 575, 518, 575, 574, 519, 520, 576, 519, 576, 575, 520, 521, 577, 520, 577, 576, 521, 522, 578, 521, 578, 577, 522, 523, 579, 522, 579, 578, 523, 524, 580, 523, 580, 579, 524, 525, 581, 524, 581, 580, 525, 526, 582, 525, 582, 581, 526, 527, 583, 526, 583, 582, 527, 528, 584, 527, 584, 583, 528, 529, 585, 528, 585, 584, 529, 530, 586, 529, 586, 585, 530, 531, 587, 530, 587, 586, 531, 532, 588, 531, 588, 587, 532, 533, 589, 532, 589, 588, 533, 534, 590, 533, 590, 589, 534, 535, 591, 534, 591, 590, 535, 536, 592, 535, 592, 591, 536, 537, 593, 536, 593, 592, 537, 538, 594, 537, 594, 593, 538, 539, 595, 538, 595, 594, 539, 540, 596, 539, 596, 595, 540, 541, 597, 540, 597, 596, 541, 542, 598, 541, 598, 597, 542, 543, 599, 542, 599, 598, 543, 544, 600, 543, 600, 599, 544, 545, 601, 544, 601, 600, 545, 546, 602, 545, 602, 601, 546, 547, 603, 546, 603, 602, 547, 548, 604, 547, 604, 603, 548, 549, 605, 548, 605, 604, 549, 550, 606, 549, 606, 605, 550, 551, 607, 550, 607, 606, 551, 552, 608, 551, 608, 607, 552, 553, 609, 552, 609, 608, 553, 554, 610, 553, 610, 609, 554, 555, 611, 554, 611, 610, 555, 556, 612, 555, 612, 611, 556, 557, 613, 556, 613, 612, 557, 558, 614, 557, 614, 613, 558, 559, 615, 558, 615, 614, 559, 560, 616, 559, 616, 615, 560, 561, 617, 560, 617, 616, 561, 562, 618, 561, 618, 617, 562, 563, 619, 562, 619, 618, 563, 564, 620, 563, 620, 619, 564, 565, 621, 564, 621, 620, 565, 566, 622, 565, 622, 621, 566, 567, 623, 566, 623, 622, 567, 568, 624, 567, 624, 623, 568, 569, 625, 568, 625, 624, 569, 69, 70, 569, 70, 625, 9, 570, 626, 9, 626, 10, 570, 571, 627, 570, 627, 626, 571, 572, 628, 571, 628, 627, 572, 573, 629, 572, 629, 628, 573, 574, 630, 573, 630, 629, 574, 575, 631, 574, 631, 630, 575, 576, 632, 575, 632, 631, 576, 577, 633, 576, 633, 632, 577, 578, 634, 577, 634, 633, 578, 579, 635, 578, 635, 634, 579, 580, 636, 579, 636, 635, 580, 581, 637, 580, 637, 636, 581, 582, 638, 581, 638, 637, 582, 583, 639, 582, 639, 638, 583, 584, 640, 583, 640, 639, 584, 585, 641, 584, 641, 640, 585, 586, 642, 585, 642, 641, 586, 587, 643, 586, 643, 642, 587, 588, 644, 587, 644, 643, 588, 589, 645, 588, 645, 644, 589, 590, 646, 589, 646, 645, 590, 591, 647, 590, 647, 646, 591, 592, 648, 591, 648, 647, 592, 593, 649, 592, 649, 648, 593, 594, 650, 593, 650, 649, 594, 595, 651, 594, 651, 650, 595, 596, 652, 595, 652, 651, 596, 597, 653, 596, 653, 652, 597, 598, 654, 597, 654, 653, 598, 599, 655, 598, 655, 654, 599, 600, 656, 599, 656, 655, 600, 601, 657, 600, 657, 656, 601, 602, 658, 601, 658, 657, 602, 603, 659, 602, 659, 658, 603, 604, 660, 603, 660, 659, 604, 605, 661, 604, 661, 660, 605, 606, 662, 605, 662, 661, 606, 607, 663, 606, 663, 662, 607, 608, 664, 607, 664, 663, 608, 609, 665, 608, 665, 664, 609, 610, 666, 609, 666, 665, 610, 611, 667, 610, 667, 666, 611, 612, 668, 611, 668, 667, 612, 613, 669, 612, 669, 668, 613, 614, 670, 613, 670, 669, 614, 615, 671, 614, 671, 670, 615, 616, 672, 615, 672, 671, 616, 617, 673, 616, 673, 672, 617, 618, 674, 617, 674, 673, 618, 619, 675, 618, 675, 674, 619, 620, 676, 619, 676, 675, 620, 621, 677, 620, 677, 676, 621, 622, 678, 621, 678, 677, 622, 623, 679, 622, 679, 678, 623, 624, 680, 623, 680, 679, 624, 625, 681, 624, 681, 680, 625, 70, 71, 625, 71, 681, 10, 626, 682, 10, 682, 11, 626, 627, 683, 626, 683, 682, 627, 628, 684, 627, 684, 683, 628, 629, 685, 628, 685, 684, 629, 630, 686, 629, 686, 685, 630, 631, 687, 630, 687, 686, 631, 632, 688, 631, 688, 687, 632, 633, 689, 632, 689, 688, 633, 634, 690, 633, 690, 689, 634, 635, 691, 634, 691, 690, 635, 636, 692, 635, 692, 691, 636, 637, 693, 636, 693, 692, 637, 638, 694, 637, 694, 693, 638, 639, 695, 638, 695, 694, 639, 640, 696, 639, 696, 695, 640, 641, 697, 640, 697, 696, 641, 642, 698, 641, 698, 697, 642, 643, 699, 642, 699, 698, 643, 644, 700, 643, 700, 699, 644, 645, 701, 644, 701, 700, 645, 646, 702, 645, 702, 701, 646, 647, 703, 646, 703, 702, 647, 648, 704, 647, 704, 703, 648, 649, 705, 648, 705, 704, 649, 650, 706, 649, 706, 705, 650, 651, 707, 650, 707, 706, 651, 652, 708, 651, 708, 707, 652, 653, 709, 652, 709, 708, 653, 654, 710, 653, 710, 709, 654, 655, 711, 654, 711, 710, 655, 656, 712, 655, 712, 711, 656, 657, 713, 656, 713, 712, 657, 658, 714, 657, 714, 713, 658, 659, 715, 658, 715, 714, 659, 660, 716, 659, 716, 715, 660, 661, 717, 660, 717, 716, 661, 662, 718, 661, 718, 717, 662, 663, 719, 662, 719, 718, 663, 664, 720, 663, 720, 719, 664, 665, 721, 664, 721, 720, 665, 666, 722, 665, 722, 721, 666, 667, 723, 666, 723, 722, 667, 668, 724, 667, 724, 723, 668, 669, 725, 668, 725, 724, 669, 670, 726, 669, 726, 725, 670, 671, 727, 670, 727, 726, 671, 672, 728, 671, 728, 727, 672, 673, 729, 672, 729, 728, 673, 674, 730, 673, 730, 729, 674, 675, 731, 674, 731, 730, 675, 676, 732, 675, 732, 731, 676, 677, 733, 676, 733, 732, 677, 678, 734, 677, 734, 733, 678, 679, 735, 678, 735, 734, 679, 680, 736, 679, 736, 735, 680, 681, 737, 680, 737, 736, 681, 71, 72, 681, 72, 737, 11, 682, 738, 11, 738, 12, 682, 683, 739, 682, 739, 738, 683, 684, 740, 683, 740, 739, 684, 685, 741, 684, 741, 740, 685, 686, 742, 685, 742, 741, 686, 687, 743, 686, 743, 742, 687, 688, 744, 687, 744, 743, 688, 689, 745, 688, 745, 744, 689, 690, 746, 689, 746, 745, 690, 691, 747, 690, 747, 746, 691, 692, 748, 691, 748, 747, 692, 693, 749, 692, 749, 748, 693, 694, 750, 693, 750, 749, 694, 695, 751, 694, 751, 750, 695, 696, 752, 695, 752, 751, 696, 697, 753, 696, 753, 752, 697, 698, 754, 697, 754, 753, 698, 699, 755, 698, 755, 754, 699, 700, 756, 699, 756, 755, 700, 701, 757, 700, 757, 756, 701, 702, 758, 701, 758, 757, 702, 703, 759, 702, 759, 758, 703, 704, 760, 703, 760, 759, 704, 705, 761, 704, 761, 760, 705, 706, 762, 705, 762, 761, 706, 707, 763, 706, 763, 762, 707, 708, 764, 707, 764, 763, 708, 709, 765, 708, 765, 764, 709, 710, 766, 709, 766, 765, 710, 711, 767, 710, 767, 766, 711, 712, 768, 711, 768, 767, 712, 713, 769, 712, 769, 768, 713, 714, 770, 713, 770, 769, 714, 715, 771, 714, 771, 770, 715, 716, 772, 715, 772, 771, 716, 717, 773, 716, 773, 772, 717, 718, 774, 717, 774, 773, 718, 719, 775, 718, 775, 774, 719, 720, 776, 719, 776, 775, 720, 721, 777, 720, 777, 776, 721, 722, 778, 721, 778, 777, 722, 723, 779, 722, 779, 778, 723, 724, 780, 723, 780, 779, 724, 725, 781, 724, 781, 780, 725, 726, 782, 725, 782, 781, 726, 727, 783, 726, 783, 782, 727, 728, 784, 727, 784, 783, 728, 729, 785, 728, 785, 784, 729, 730, 786, 729, 786, 785, 730, 731, 787, 730, 787, 786, 731, 732, 788, 731, 788, 787, 732, 733, 789, 732, 789, 788, 733, 734, 790, 733, 790, 789, 734, 735, 791, 734, 791, 790, 735, 736, 792, 735, 792, 791, 736, 737, 793, 736, 793, 792, 737, 72, 73, 737, 73, 793, 12, 738, 794, 12, 794, 13, 738, 739, 795, 738, 795, 794, 739, 740, 796, 739, 796, 795, 740, 741, 797, 740, 797, 796, 741, 742, 798, 741, 798, 797, 742, 743, 799, 742, 799, 798, 743, 744, 800, 743, 800, 799, 744, 745, 801, 744, 801, 800, 745, 746, 802, 745, 802, 801, 746, 747, 803, 746, 803, 802, 747, 748, 804, 747, 804, 803, 748, 749, 805, 748, 805, 804, 749, 750, 806, 749, 806, 805, 750, 751, 807, 750, 807, 806, 751, 752, 808, 751, 808, 807, 752, 753, 809, 752, 809, 808, 753, 754, 810, 753, 810, 809, 754, 755, 811, 754, 811, 810, 755, 756, 812, 755, 812, 811, 756, 757, 813, 756, 813, 812, 757, 758, 814, 757, 814, 813, 758, 759, 815, 758, 815, 814, 759, 760, 816, 759, 816, 815, 760, 761, 817, 760, 817, 816, 761, 762, 818, 761, 818, 817, 762, 763, 819, 762, 819, 818, 763, 764, 820, 763, 820, 819, 764, 765, 821, 764, 821, 820, 765, 766, 822, 765, 822, 821, 766, 767, 823, 766, 823, 822, 767, 768, 824, 767, 824, 823, 768, 769, 825, 768, 825, 824, 769, 770, 826, 769, 826, 825, 770, 771, 827, 770, 827, 826, 771, 772, 828, 771, 828, 827, 772, 773, 829, 772, 829, 828, 773, 774, 830, 773, 830, 829, 774, 775, 831, 774, 831, 830, 775, 776, 832, 775, 832, 831, 776, 777, 833, 776, 833, 832, 777, 778, 834, 777, 834, 833, 778, 779, 835, 778, 835, 834, 779, 780, 836, 779, 836, 835, 780, 781, 837, 780, 837, 836, 781, 782, 838, 781, 838, 837, 782, 783, 839, 782, 839, 838, 783, 784, 840, 783, 840, 839, 784, 785, 841, 784, 841, 840, 785, 786, 842, 785, 842, 841, 786, 787, 843, 786, 843, 842, 787, 788, 844, 787, 844, 843, 788, 789, 845, 788, 845, 844, 789, 790, 846, 789, 846, 845, 790, 791, 847, 790, 847, 846, 791, 792, 848, 791, 848, 847, 792, 793, 849, 792, 849, 848, 793, 73, 74, 793, 74, 849, 13, 794, 850, 13, 850, 14, 794, 795, 851, 794, 851, 850, 795, 796, 852, 795, 852, 851, 796, 797, 853, 796, 853, 852, 797, 798, 854, 797, 854, 853, 798, 799, 855, 798, 855, 854, 799, 800, 856, 799, 856, 855, 800, 801, 857, 800, 857, 856, 801, 802, 858, 801, 858, 857, 802, 803, 859, 802, 859, 858, 803, 804, 860, 803, 860, 859, 804, 805, 861, 804, 861, 860, 805, 806, 862, 805, 862, 861, 806, 807, 863, 806, 863, 862, 807, 808, 864, 807, 864, 863, 808, 809, 865, 808, 865, 864, 809, 810, 866, 809, 866, 865, 810, 811, 867, 810, 867, 866, 811, 812, 868, 811, 868, 867, 812, 813, 869, 812, 869, 868, 813, 814, 870, 813, 870, 869, 814, 815, 871, 814, 871, 870, 815, 816, 872, 815, 872, 871, 816, 817, 873, 816, 873, 872, 817, 818, 874, 817, 874, 873, 818, 819, 875, 818, 875, 874, 819, 820, 876, 819, 876, 875, 820, 821, 877, 820, 877, 876, 821, 822, 878, 821, 878, 877, 822, 823, 879, 822, 879, 878, 823, 824, 880, 823, 880, 879, 824, 825, 881, 824, 881, 880, 825, 826, 882, 825, 882, 881, 826, 827, 883, 826, 883, 882, 827, 828, 884, 827, 884, 883, 828, 829, 885, 828, 885, 884, 829, 830, 886, 829, 886, 885, 830, 831, 887, 830, 887, 886, 831, 832, 888, 831, 888, 887, 832, 833, 889, 832, 889, 888, 833, 834, 890, 833, 890, 889, 834, 835, 891, 834, 891, 890, 835, 836, 892, 835, 892, 891, 836, 837, 893, 836, 893, 892, 837, 838, 894, 837, 894, 893, 838, 839, 895, 838, 895, 894, 839, 840, 896, 839, 896, 895, 840, 841, 897, 840, 897, 896, 841, 842, 898, 841, 898, 897, 842, 843, 899, 842, 899, 898, 843, 844, 900, 843, 900, 899, 844, 845, 901, 844, 901, 900, 845, 846, 902, 845, 902, 901, 846, 847, 903, 846, 903, 902, 847, 848, 904, 847, 904, 903, 848, 849, 905, 848, 905, 904, 849, 74, 75, 849, 75, 905, 14, 850, 906, 14, 906, 15, 850, 851, 907, 850, 907, 906, 851, 852, 908, 851, 908, 907, 852, 853, 909, 852, 909, 908, 853, 854, 910, 853, 910, 909, 854, 855, 911, 854, 911, 910, 855, 856, 912, 855, 912, 911, 856, 857, 913, 856, 913, 912, 857, 858, 914, 857, 914, 913, 858, 859, 915, 858, 915, 914, 859, 860, 916, 859, 916, 915, 860, 861, 917, 860, 917, 916, 861, 862, 918, 861, 918, 917, 862, 863, 919, 862, 919, 918, 863, 864, 920, 863, 920, 919, 864, 865, 921, 864, 921, 920, 865, 866, 922, 865, 922, 921, 866, 867, 923, 866, 923, 922, 867, 868, 924, 867, 924, 923, 868, 869, 925, 868, 925, 924, 869, 870, 926, 869, 926, 925, 870, 871, 927, 870, 927, 926, 871, 872, 928, 871, 928, 927, 872, 873, 929, 872, 929, 928, 873, 874, 930, 873, 930, 929, 874, 875, 931, 874, 931, 930, 875, 876, 932, 875, 932, 931, 876, 877, 933, 876, 933, 932, 877, 878, 934, 877, 934, 933, 878, 879, 935, 878, 935, 934, 879, 880, 936, 879, 936, 935, 880, 881, 937, 880, 937, 936, 881, 882, 938, 881, 938, 937, 882, 883, 939, 882, 939, 938, 883, 884, 940, 883, 940, 939, 884, 885, 941, 884, 941, 940, 885, 886, 942, 885, 942, 941, 886, 887, 943, 886, 943, 942, 887, 888, 944, 887, 944, 943, 888, 889, 945, 888, 945, 944, 889, 890, 946, 889, 946, 945, 890, 891, 947, 890, 947, 946, 891, 892, 948, 891, 948, 947, 892, 893, 949, 892, 949, 948, 893, 894, 950, 893, 950, 949, 894, 895, 951, 894, 951, 950, 895, 896, 952, 895, 952, 951, 896, 897, 953, 896, 953, 952, 897, 898, 954, 897, 954, 953, 898, 899, 955, 898, 955, 954, 899, 900, 956, 899, 956, 955, 900, 901, 957, 900, 957, 956, 901, 902, 958, 901, 958, 957, 902, 903, 959, 902, 959, 958, 903, 904, 960, 903, 960, 959, 904, 905, 961, 904, 961, 960, 905, 75, 76, 905, 76, 961, 15, 906, 962, 15, 962, 16, 906, 907, 963, 906, 963, 962, 907, 908, 964, 907, 964, 963, 908, 909, 965, 908, 965, 964, 909, 910, 966, 909, 966, 965, 910, 911, 967, 910, 967, 966, 911, 912, 968, 911, 968, 967, 912, 913, 969, 912, 969, 968, 913, 914, 970, 913, 970, 969, 914, 915, 971, 914, 971, 970, 915, 916, 972, 915, 972, 971, 916, 917, 973, 916, 973, 972, 917, 918, 974, 917, 974, 973, 918, 919, 975, 918, 975, 974, 919, 920, 976, 919, 976, 975, 920, 921, 977, 920, 977, 976, 921, 922, 978, 921, 978, 977, 922, 923, 979, 922, 979, 978, 923, 924, 980, 923, 980, 979, 924, 925, 981, 924, 981, 980, 925, 926, 982, 925, 982, 981, 926, 927, 983, 926, 983, 982, 927, 928, 984, 927, 984, 983, 928, 929, 985, 928, 985, 984, 929, 930, 986, 929, 986, 985, 930, 931, 987, 930, 987, 986, 931, 932, 988, 931, 988, 987, 932, 933, 989, 932, 989, 988, 933, 934, 990, 933, 990, 989, 934, 935, 991, 934, 991, 990, 935, 936, 992, 935, 992, 991, 936, 937, 993, 936, 993, 992, 937, 938, 994, 937, 994, 993, 938, 939, 995, 938, 995, 994, 939, 940, 996, 939, 996, 995, 940, 941, 997, 940, 997, 996, 941, 942, 998, 941, 998, 997, 942, 943, 999, 942, 999, 998, 943, 944, 1000, 943, 1000, 999, 944, 945, 1001, 944, 1001, 1000, 945, 946, 1002, 945, 1002, 1001, 946, 947, 1003, 946, 1003, 1002, 947, 948, 1004, 947, 1004, 1003, 948, 949, 1005, 948, 1005, 1004, 949, 950, 1006, 949, 1006, 1005, 950, 951, 1007, 950, 1007, 1006, 951, 952, 1008, 951, 1008, 1007, 952, 953, 1009, 952, 1009, 1008, 953, 954, 1010, 953, 1010, 1009, 954, 955, 1011, 954, 1011, 1010, 955, 956, 1012, 955, 1012, 1011, 956, 957, 1013, 956, 1013, 1012, 957, 958, 1014, 957, 1014, 1013, 958, 959, 1015, 958, 1015, 1014, 959, 960, 1016, 959, 1016, 1015, 960, 961, 1017, 960, 1017, 1016, 961, 76, 77, 961, 77, 1017, 16, 962, 1018, 16, 1018, 17, 962, 963, 1019, 962, 1019, 1018, 963, 964, 1020, 963, 1020, 1019, 964, 965, 1021, 964, 1021, 1020, 965, 966, 1022, 965, 1022, 1021, 966, 967, 1023, 966, 1023, 1022, 967, 968, 1024, 967, 1024, 1023, 968, 969, 1025, 968, 1025, 1024, 969, 970, 1026, 969, 1026, 1025, 970, 971, 1027, 970, 1027, 1026, 971, 972, 1028, 971, 1028, 1027, 972, 973, 1029, 972, 1029, 1028, 973, 974, 1030, 973, 1030, 1029, 974, 975, 1031, 974, 1031, 1030, 975, 976, 1032, 975, 1032, 1031, 976, 977, 1033, 976, 1033, 1032, 977, 978, 1034, 977, 1034, 1033, 978, 979, 1035, 978, 1035, 1034, 979, 980, 1036, 979, 1036, 1035, 980, 981, 1037, 980, 1037, 1036, 981, 982, 1038, 981, 1038, 1037, 982, 983, 1039, 982, 1039, 1038, 983, 984, 1040, 983, 1040, 1039, 984, 985, 1041, 984, 1041, 1040, 985, 986, 1042, 985, 1042, 1041, 986, 987, 1043, 986, 1043, 1042, 987, 988, 1044, 987, 1044, 1043, 988, 989, 1045, 988, 1045, 1044, 989, 990, 1046, 989, 1046, 1045, 990, 991, 1047, 990, 1047, 1046, 991, 992, 1048, 991, 1048, 1047, 992, 993, 1049, 992, 1049, 1048, 993, 994, 1050, 993, 1050, 1049, 994, 995, 1051, 994, 1051, 1050, 995, 996, 1052, 995, 1052, 1051, 996, 997, 1053, 996, 1053, 1052, 997, 998, 1054, 997, 1054, 1053, 998, 999, 1055, 998, 1055, 1054, 999, 1000, 1056, 999, 1056, 1055, 1000, 1001, 1057, 1000, 1057, 1056, 1001, 1002, 1058, 1001, 1058, 1057, 1002, 1003, 1059, 1002, 1059, 1058, 1003, 1004, 1060, 1003, 1060, 1059, 1004, 1005, 1061, 1004, 1061, 1060, 1005, 1006, 1062, 1005, 1062, 1061, 1006, 1007, 1063, 1006, 1063, 1062, 1007, 1008, 1064, 1007, 1064, 1063, 1008, 1009, 1065, 1008, 1065, 1064, 1009, 1010, 1066, 1009, 1066, 1065, 1010, 1011, 1067, 1010, 1067, 1066, 1011, 1012, 1068, 1011, 1068, 1067, 1012, 1013, 1069, 1012, 1069, 1068, 1013, 1014, 1070, 1013, 1070, 1069, 1014, 1015, 1071, 1014, 1071, 1070, 1015, 1016, 1072, 1015, 1072, 1071, 1016, 1017, 1073, 1016, 1073, 1072, 1017, 77, 78, 1017, 78, 1073, 17, 1018, 1074, 17, 1074, 18, 1018, 1019, 1075, 1018, 1075, 1074, 1019, 1020, 1076, 1019, 1076, 1075, 1020, 1021, 1077, 1020, 1077, 1076, 1021, 1022, 1078, 1021, 1078, 1077, 1022, 1023, 1079, 1022, 1079, 1078, 1023, 1024, 1080, 1023, 1080, 1079, 1024, 1025, 1081, 1024, 1081, 1080, 1025, 1026, 1082, 1025, 1082, 1081, 1026, 1027, 1083, 1026, 1083, 1082, 1027, 1028, 1084, 1027, 1084, 1083, 1028, 1029, 1085, 1028, 1085, 1084, 1029, 1030, 1086, 1029, 1086, 1085, 1030, 1031, 1087, 1030, 1087, 1086, 1031, 1032, 1088, 1031, 1088, 1087, 1032, 1033, 1089, 1032, 1089, 1088, 1033, 1034, 1090, 1033, 1090, 1089, 1034, 1035, 1091, 1034, 1091, 1090, 1035, 1036, 1092, 1035, 1092, 1091, 1036, 1037, 1093, 1036, 1093, 1092, 1037, 1038, 1094, 1037, 1094, 1093, 1038, 1039, 1095, 1038, 1095, 1094, 1039, 1040, 1096, 1039, 1096, 1095, 1040, 1041, 1097, 1040, 1097, 1096, 1041, 1042, 1098, 1041, 1098, 1097, 1042, 1043, 1099, 1042, 1099, 1098, 1043, 1044, 1100, 1043, 1100, 1099, 1044, 1045, 1101, 1044, 1101, 1100, 1045, 1046, 1102, 1045, 1102, 1101, 1046, 1047, 1103, 1046, 1103, 1102, 1047, 1048, 1104, 1047, 1104, 1103, 1048, 1049, 1105, 1048, 1105, 1104, 1049, 1050, 1106, 1049, 1106, 1105, 1050, 1051, 1107, 1050, 1107, 1106, 1051, 1052, 1108, 1051, 1108, 1107, 1052, 1053, 1109, 1052, 1109, 1108, 1053, 1054, 1110, 1053, 1110, 1109, 1054, 1055, 1111, 1054, 1111, 1110, 1055, 1056, 1112, 1055, 1112, 1111, 1056, 1057, 1113, 1056, 1113, 1112, 1057, 1058, 1114, 1057, 1114, 1113, 1058, 1059, 1115, 1058, 1115, 1114, 1059, 1060, 1116, 1059, 1116, 1115, 1060, 1061, 1117, 1060, 1117, 1116, 1061, 1062, 1118, 1061, 1118, 1117, 1062, 1063, 1119, 1062, 1119, 1118, 1063, 1064, 1120, 1063, 1120, 1119, 1064, 1065, 1121, 1064, 1121, 1120, 1065, 1066, 1122, 1065, 1122, 1121, 1066, 1067, 1123, 1066, 1123, 1122, 1067, 1068, 1124, 1067, 1124, 1123, 1068, 1069, 1125, 1068, 1125, 1124, 1069, 1070, 1126, 1069, 1126, 1125, 1070, 1071, 1127, 1070, 1127, 1126, 1071, 1072, 1128, 1071, 1128, 1127, 1072, 1073, 1129, 1072, 1129, 1128, 1073, 78, 79, 1073, 79, 1129, 18, 1074, 1130, 18, 1130, 19, 1074, 1075, 1131, 1074, 1131, 1130, 1075, 1076, 1132, 1075, 1132, 1131, 1076, 1077, 1133, 1076, 1133, 1132, 1077, 1078, 1134, 1077, 1134, 1133, 1078, 1079, 1135, 1078, 1135, 1134, 1079, 1080, 1136, 1079, 1136, 1135, 1080, 1081, 1137, 1080, 1137, 1136, 1081, 1082, 1138, 1081, 1138, 1137, 1082, 1083, 1139, 1082, 1139, 1138, 1083, 1084, 1140, 1083, 1140, 1139, 1084, 1085, 1141, 1084, 1141, 1140, 1085, 1086, 1142, 1085, 1142, 1141, 1086, 1087, 1143, 1086, 1143, 1142, 1087, 1088, 1144, 1087, 1144, 1143, 1088, 1089, 1145, 1088, 1145, 1144, 1089, 1090, 1146, 1089, 1146, 1145, 1090, 1091, 1147, 1090, 1147, 1146, 1091, 1092, 1148, 1091, 1148, 1147, 1092, 1093, 1149, 1092, 1149, 1148, 1093, 1094, 1150, 1093, 1150, 1149, 1094, 1095, 1151, 1094, 1151, 1150, 1095, 1096, 1152, 1095, 1152, 1151, 1096, 1097, 1153, 1096, 1153, 1152, 1097, 1098, 1154, 1097, 1154, 1153, 1098, 1099, 1155, 1098, 1155, 1154, 1099, 1100, 1156, 1099, 1156, 1155, 1100, 1101, 1157, 1100, 1157, 1156, 1101, 1102, 1158, 1101, 1158, 1157, 1102, 1103, 1159, 1102, 1159, 1158, 1103, 1104, 1160, 1103, 1160, 1159, 1104, 1105, 1161, 1104, 1161, 1160, 1105, 1106, 1162, 1105, 1162, 1161, 1106, 1107, 1163, 1106, 1163, 1162, 1107, 1108, 1164, 1107, 1164, 1163, 1108, 1109, 1165, 1108, 1165, 1164, 1109, 1110, 1166, 1109, 1166, 1165, 1110, 1111, 1167, 1110, 1167, 1166, 1111, 1112, 1168, 1111, 1168, 1167, 1112, 1113, 1169, 1112, 1169, 1168, 1113, 1114, 1170, 1113, 1170, 1169, 1114, 1115, 1171, 1114, 1171, 1170, 1115, 1116, 1172, 1115, 1172, 1171, 1116, 1117, 1173, 1116, 1173, 1172, 1117, 1118, 1174, 1117, 1174, 1173, 1118, 1119, 1175, 1118, 1175, 1174, 1119, 1120, 1176, 1119, 1176, 1175, 1120, 1121, 1177, 1120, 1177, 1176, 1121, 1122, 1178, 1121, 1178, 1177, 1122, 1123, 1179, 1122, 1179, 1178, 1123, 1124, 1180, 1123, 1180, 1179, 1124, 1125, 1181, 1124, 1181, 1180, 1125, 1126, 1182, 1125, 1182, 1181, 1126, 1127, 1183, 1126, 1183, 1182, 1127, 1128, 1184, 1127, 1184, 1183, 1128, 1129, 1185, 1128, 1185, 1184, 1129, 79, 80, 1129, 80, 1185, 19, 1130, 1186, 19, 1186, 20, 1130, 1131, 1187, 1130, 1187, 1186, 1131, 1132, 1188, 1131, 1188, 1187, 1132, 1133, 1189, 1132, 1189, 1188, 1133, 1134, 1190, 1133, 1190, 1189, 1134, 1135, 1191, 1134, 1191, 1190, 1135, 1136, 1192, 1135, 1192, 1191, 1136, 1137, 1193, 1136, 1193, 1192, 1137, 1138, 1194, 1137, 1194, 1193, 1138, 1139, 1195, 1138, 1195, 1194, 1139, 1140, 1196, 1139, 1196, 1195, 1140, 1141, 1197, 1140, 1197, 1196, 1141, 1142, 1198, 1141, 1198, 1197, 1142, 1143, 1199, 1142, 1199, 1198, 1143, 1144, 1200, 1143, 1200, 1199, 1144, 1145, 1201, 1144, 1201, 1200, 1145, 1146, 1202, 1145, 1202, 1201, 1146, 1147, 1203, 1146, 1203, 1202, 1147, 1148, 1204, 1147, 1204, 1203, 1148, 1149, 1205, 1148, 1205, 1204, 1149, 1150, 1206, 1149, 1206, 1205, 1150, 1151, 1207, 1150, 1207, 1206, 1151, 1152, 1208, 1151, 1208, 1207, 1152, 1153, 1209, 1152, 1209, 1208, 1153, 1154, 1210, 1153, 1210, 1209, 1154, 1155, 1211, 1154, 1211, 1210, 1155, 1156, 1212, 1155, 1212, 1211, 1156, 1157, 1213, 1156, 1213, 1212, 1157, 1158, 1214, 1157, 1214, 1213, 1158, 1159, 1215, 1158, 1215, 1214, 1159, 1160, 1216, 1159, 1216, 1215, 1160, 1161, 1217, 1160, 1217, 1216, 1161, 1162, 1218, 1161, 1218, 1217, 1162, 1163, 1219, 1162, 1219, 1218, 1163, 1164, 1220, 1163, 1220, 1219, 1164, 1165, 1221, 1164, 1221, 1220, 1165, 1166, 1222, 1165, 1222, 1221, 1166, 1167, 1223, 1166, 1223, 1222, 1167, 1168, 1224, 1167, 1224, 1223, 1168, 1169, 1225, 1168, 1225, 1224, 1169, 1170, 1226, 1169, 1226, 1225, 1170, 1171, 1227, 1170, 1227, 1226, 1171, 1172, 1228, 1171, 1228, 1227, 1172, 1173, 1229, 1172, 1229, 1228, 1173, 1174, 1230, 1173, 1230, 1229, 1174, 1175, 1231, 1174, 1231, 1230, 1175, 1176, 1232, 1175, 1232, 1231, 1176, 1177, 1233, 1176, 1233, 1232, 1177, 1178, 1234, 1177, 1234, 1233, 1178, 1179, 1235, 1178, 1235, 1234, 1179, 1180, 1236, 1179, 1236, 1235, 1180, 1181, 1237, 1180, 1237, 1236, 1181, 1182, 1238, 1181, 1238, 1237, 1182, 1183, 1239, 1182, 1239, 1238, 1183, 1184, 1240, 1183, 1240, 1239, 1184, 1185, 1241, 1184, 1241, 1240, 1185, 80, 81, 1185, 81, 1241, 20, 1186, 1242, 20, 1242, 21, 1186, 1187, 1243, 1186, 1243, 1242, 1187, 1188, 1244, 1187, 1244, 1243, 1188, 1189, 1245, 1188, 1245, 1244, 1189, 1190, 1246, 1189, 1246, 1245, 1190, 1191, 1247, 1190, 1247, 1246, 1191, 1192, 1248, 1191, 1248, 1247, 1192, 1193, 1249, 1192, 1249, 1248, 1193, 1194, 1250, 1193, 1250, 1249, 1194, 1195, 1251, 1194, 1251, 1250, 1195, 1196, 1252, 1195, 1252, 1251, 1196, 1197, 1253, 1196, 1253, 1252, 1197, 1198, 1254, 1197, 1254, 1253, 1198, 1199, 1255, 1198, 1255, 1254, 1199, 1200, 1256, 1199, 1256, 1255, 1200, 1201, 1257, 1200, 1257, 1256, 1201, 1202, 1258, 1201, 1258, 1257, 1202, 1203, 1259, 1202, 1259, 1258, 1203, 1204, 1260, 1203, 1260, 1259, 1204, 1205, 1261, 1204, 1261, 1260, 1205, 1206, 1262, 1205, 1262, 1261, 1206, 1207, 1263, 1206, 1263, 1262, 1207, 1208, 1264, 1207, 1264, 1263, 1208, 1209, 1265, 1208, 1265, 1264, 1209, 1210, 1266, 1209, 1266, 1265, 1210, 1211, 1267, 1210, 1267, 1266, 1211, 1212, 1268, 1211, 1268, 1267, 1212, 1213, 1269, 1212, 1269, 1268, 1213, 1214, 1270, 1213, 1270, 1269, 1214, 1215, 1271, 1214, 1271, 1270, 1215, 1216, 1272, 1215, 1272, 1271, 1216, 1217, 1273, 1216, 1273, 1272, 1217, 1218, 1274, 1217, 1274, 1273, 1218, 1219, 1275, 1218, 1275, 1274, 1219, 1220, 1276, 1219, 1276, 1275, 1220, 1221, 1277, 1220, 1277, 1276, 1221, 1222, 1278, 1221, 1278, 1277, 1222, 1223, 1279, 1222, 1279, 1278, 1223, 1224, 1280, 1223, 1280, 1279, 1224, 1225, 1281, 1224, 1281, 1280, 1225, 1226, 1282, 1225, 1282, 1281, 1226, 1227, 1283, 1226, 1283, 1282, 1227, 1228, 1284, 1227, 1284, 1283, 1228, 1229, 1285, 1228, 1285, 1284, 1229, 1230, 1286, 1229, 1286, 1285, 1230, 1231, 1287, 1230, 1287, 1286, 1231, 1232, 1288, 1231, 1288, 1287, 1232, 1233, 1289, 1232, 1289, 1288, 1233, 1234, 1290, 1233, 1290, 1289, 1234, 1235, 1291, 1234, 1291, 1290, 1235, 1236, 1292, 1235, 1292, 1291, 1236, 1237, 1293, 1236, 1293, 1292, 1237, 1238, 1294, 1237, 1294, 1293, 1238, 1239, 1295, 1238, 1295, 1294, 1239, 1240, 1296, 1239, 1296, 1295, 1240, 1241, 1297, 1240, 1297, 1296, 1241, 81, 82, 1241, 82, 1297, 21, 1242, 1298, 21, 1298, 22, 1242, 1243, 1299, 1242, 1299, 1298, 1243, 1244, 1300, 1243, 1300, 1299, 1244, 1245, 1301, 1244, 1301, 1300, 1245, 1246, 1302, 1245, 1302, 1301, 1246, 1247, 1303, 1246, 1303, 1302, 1247, 1248, 1304, 1247, 1304, 1303, 1248, 1249, 1305, 1248, 1305, 1304, 1249, 1250, 1306, 1249, 1306, 1305, 1250, 1251, 1307, 1250, 1307, 1306, 1251, 1252, 1308, 1251, 1308, 1307, 1252, 1253, 1309, 1252, 1309, 1308, 1253, 1254, 1310, 1253, 1310, 1309, 1254, 1255, 1311, 1254, 1311, 1310, 1255, 1256, 1312, 1255, 1312, 1311, 1256, 1257, 1313, 1256, 1313, 1312, 1257, 1258, 1314, 1257, 1314, 1313, 1258, 1259, 1315, 1258, 1315, 1314, 1259, 1260, 1316, 1259, 1316, 1315, 1260, 1261, 1317, 1260, 1317, 1316, 1261, 1262, 1318, 1261, 1318, 1317, 1262, 1263, 1319, 1262, 1319, 1318, 1263, 1264, 1320, 1263, 1320, 1319, 1264, 1265, 1321, 1264, 1321, 1320, 1265, 1266, 1322, 1265, 1322, 1321, 1266, 1267, 1323, 1266, 1323, 1322, 1267, 1268, 1324, 1267, 1324, 1323, 1268, 1269, 1325, 1268, 1325, 1324, 1269, 1270, 1326, 1269, 1326, 1325, 1270, 1271, 1327, 1270, 1327, 1326, 1271, 1272, 1328, 1271, 1328, 1327, 1272, 1273, 1329, 1272, 1329, 1328, 1273, 1274, 1330, 1273, 1330, 1329, 1274, 1275, 1331, 1274, 1331, 1330, 1275, 1276, 1332, 1275, 1332, 1331, 1276, 1277, 1333, 1276, 1333, 1332, 1277, 1278, 1334, 1277, 1334, 1333, 1278, 1279, 1335, 1278, 1335, 1334, 1279, 1280, 1336, 1279, 1336, 1335, 1280, 1281, 1337, 1280, 1337, 1336, 1281, 1282, 1338, 1281, 1338, 1337, 1282, 1283, 1339, 1282, 1339, 1338, 1283, 1284, 1340, 1283, 1340, 1339, 1284, 1285, 1341, 1284, 1341, 1340, 1285, 1286, 1342, 1285, 1342, 1341, 1286, 1287, 1343, 1286, 1343, 1342, 1287, 1288, 1344, 1287, 1344, 1343, 1288, 1289, 1345, 1288, 1345, 1344, 1289, 1290, 1346, 1289, 1346, 1345, 1290, 1291, 1347, 1290, 1347, 1346, 1291, 1292, 1348, 1291, 1348, 1347, 1292, 1293, 1349, 1292, 1349, 1348, 1293, 1294, 1350, 1293, 1350, 1349, 1294, 1295, 1351, 1294, 1351, 1350, 1295, 1296, 1352, 1295, 1352, 1351, 1296, 1297, 1353, 1296, 1353, 1352, 1297, 82, 83, 1297, 83, 1353, 22, 1298, 1354, 22, 1354, 23, 1298, 1299, 1355, 1298, 1355, 1354, 1299, 1300, 1356, 1299, 1356, 1355, 1300, 1301, 1357, 1300, 1357, 1356, 1301, 1302, 1358, 1301, 1358, 1357, 1302, 1303, 1359, 1302, 1359, 1358, 1303, 1304, 1360, 1303, 1360, 1359, 1304, 1305, 1361, 1304, 1361, 1360, 1305, 1306, 1362, 1305, 1362, 1361, 1306, 1307, 1363, 1306, 1363, 1362, 1307, 1308, 1364, 1307, 1364, 1363, 1308, 1309, 1365, 1308, 1365, 1364, 1309, 1310, 1366, 1309, 1366, 1365, 1310, 1311, 1367, 1310, 1367, 1366, 1311, 1312, 1368, 1311, 1368, 1367, 1312, 1313, 1369, 1312, 1369, 1368, 1313, 1314, 1370, 1313, 1370, 1369, 1314, 1315, 1371, 1314, 1371, 1370, 1315, 1316, 1372, 1315, 1372, 1371, 1316, 1317, 1373, 1316, 1373, 1372, 1317, 1318, 1374, 1317, 1374, 1373, 1318, 1319, 1375, 1318, 1375, 1374, 1319, 1320, 1376, 1319, 1376, 1375, 1320, 1321, 1377, 1320, 1377, 1376, 1321, 1322, 1378, 1321, 1378, 1377, 1322, 1323, 1379, 1322, 1379, 1378, 1323, 1324, 1380, 1323, 1380, 1379, 1324, 1325, 1381, 1324, 1381, 1380, 1325, 1326, 1382, 1325, 1382, 1381, 1326, 1327, 1383, 1326, 1383, 1382, 1327, 1328, 1384, 1327, 1384, 1383, 1328, 1329, 1385, 1328, 1385, 1384, 1329, 1330, 1386, 1329, 1386, 1385, 1330, 1331, 1387, 1330, 1387, 1386, 1331, 1332, 1388, 1331, 1388, 1387, 1332, 1333, 1389, 1332, 1389, 1388, 1333, 1334, 1390, 1333, 1390, 1389, 1334, 1335, 1391, 1334, 1391, 1390, 1335, 1336, 1392, 1335, 1392, 1391, 1336, 1337, 1393, 1336, 1393, 1392, 1337, 1338, 1394, 1337, 1394, 1393, 1338, 1339, 1395, 1338, 1395, 1394, 1339, 1340, 1396, 1339, 1396, 1395, 1340, 1341, 1397, 1340, 1397, 1396, 1341, 1342, 1398, 1341, 1398, 1397, 1342, 1343, 1399, 1342, 1399, 1398, 1343, 1344, 1400, 1343, 1400, 1399, 1344, 1345, 1401, 1344, 1401, 1400, 1345, 1346, 1402, 1345, 1402, 1401, 1346, 1347, 1403, 1346, 1403, 1402, 1347, 1348, 1404, 1347, 1404, 1403, 1348, 1349, 1405, 1348, 1405, 1404, 1349, 1350, 1406, 1349, 1406, 1405, 1350, 1351, 1407, 1350, 1407, 1406, 1351, 1352, 1408, 1351, 1408, 1407, 1352, 1353, 1409, 1352, 1409, 1408, 1353, 83, 84, 1353, 84, 1409, 23, 1354, 1410, 23, 1410, 24, 1354, 1355, 1411, 1354, 1411, 1410, 1355, 1356, 1412, 1355, 1412, 1411, 1356, 1357, 1413, 1356, 1413, 1412, 1357, 1358, 1414, 1357, 1414, 1413, 1358, 1359, 1415, 1358, 1415, 1414, 1359, 1360, 1416, 1359, 1416, 1415, 1360, 1361, 1417, 1360, 1417, 1416, 1361, 1362, 1418, 1361, 1418, 1417, 1362, 1363, 1419, 1362, 1419, 1418, 1363, 1364, 1420, 1363, 1420, 1419, 1364, 1365, 1421, 1364, 1421, 1420, 1365, 1366, 1422, 1365, 1422, 1421, 1366, 1367, 1423, 1366, 1423, 1422, 1367, 1368, 1424, 1367, 1424, 1423, 1368, 1369, 1425, 1368, 1425, 1424, 1369, 1370, 1426, 1369, 1426, 1425, 1370, 1371, 1427, 1370, 1427, 1426, 1371, 1372, 1428, 1371, 1428, 1427, 1372, 1373, 1429, 1372, 1429, 1428, 1373, 1374, 1430, 1373, 1430, 1429, 1374, 1375, 1431, 1374, 1431, 1430, 1375, 1376, 1432, 1375, 1432, 1431, 1376, 1377, 1433, 1376, 1433, 1432, 1377, 1378, 1434, 1377, 1434, 1433, 1378, 1379, 1435, 1378, 1435, 1434, 1379, 1380, 1436, 1379, 1436, 1435, 1380, 1381, 1437, 1380, 1437, 1436, 1381, 1382, 1438, 1381, 1438, 1437, 1382, 1383, 1439, 1382, 1439, 1438, 1383, 1384, 1440, 1383, 1440, 1439, 1384, 1385, 1441, 1384, 1441, 1440, 1385, 1386, 1442, 1385, 1442, 1441, 1386, 1387, 1443, 1386, 1443, 1442, 1387, 1388, 1444, 1387, 1444, 1443, 1388, 1389, 1445, 1388, 1445, 1444, 1389, 1390, 1446, 1389, 1446, 1445, 1390, 1391, 1447, 1390, 1447, 1446, 1391, 1392, 1448, 1391, 1448, 1447, 1392, 1393, 1449, 1392, 1449, 1448, 1393, 1394, 1450, 1393, 1450, 1449, 1394, 1395, 1451, 1394, 1451, 1450, 1395, 1396, 1452, 1395, 1452, 1451, 1396, 1397, 1453, 1396, 1453, 1452, 1397, 1398, 1454, 1397, 1454, 1453, 1398, 1399, 1455, 1398, 1455, 1454, 1399, 1400, 1456, 1399, 1456, 1455, 1400, 1401, 1457, 1400, 1457, 1456, 1401, 1402, 1458, 1401, 1458, 1457, 1402, 1403, 1459, 1402, 1459, 1458, 1403, 1404, 1460, 1403, 1460, 1459, 1404, 1405, 1461, 1404, 1461, 1460, 1405, 1406, 1462, 1405, 1462, 1461, 1406, 1407, 1463, 1406, 1463, 1462, 1407, 1408, 1464, 1407, 1464, 1463, 1408, 1409, 1465, 1408, 1465, 1464, 1409, 84, 85, 1409, 85, 1465, 24, 1410, 1466, 24, 1466, 25, 1410, 1411, 1467, 1410, 1467, 1466, 1411, 1412, 1468, 1411, 1468, 1467, 1412, 1413, 1469, 1412, 1469, 1468, 1413, 1414, 1470, 1413, 1470, 1469, 1414, 1415, 1471, 1414, 1471, 1470, 1415, 1416, 1472, 1415, 1472, 1471, 1416, 1417, 1473, 1416, 1473, 1472, 1417, 1418, 1474, 1417, 1474, 1473, 1418, 1419, 1475, 1418, 1475, 1474, 1419, 1420, 1476, 1419, 1476, 1475, 1420, 1421, 1477, 1420, 1477, 1476, 1421, 1422, 1478, 1421, 1478, 1477, 1422, 1423, 1479, 1422, 1479, 1478, 1423, 1424, 1480, 1423, 1480, 1479, 1424, 1425, 1481, 1424, 1481, 1480, 1425, 1426, 1482, 1425, 1482, 1481, 1426, 1427, 1483, 1426, 1483, 1482, 1427, 1428, 1484, 1427, 1484, 1483, 1428, 1429, 1485, 1428, 1485, 1484, 1429, 1430, 1486, 1429, 1486, 1485, 1430, 1431, 1487, 1430, 1487, 1486, 1431, 1432, 1488, 1431, 1488, 1487, 1432, 1433, 1489, 1432, 1489, 1488, 1433, 1434, 1490, 1433, 1490, 1489, 1434, 1435, 1491, 1434, 1491, 1490, 1435, 1436, 1492, 1435, 1492, 1491, 1436, 1437, 1493, 1436, 1493, 1492, 1437, 1438, 1494, 1437, 1494, 1493, 1438, 1439, 1495, 1438, 1495, 1494, 1439, 1440, 1496, 1439, 1496, 1495, 1440, 1441, 1497, 1440, 1497, 1496, 1441, 1442, 1498, 1441, 1498, 1497, 1442, 1443, 1499, 1442, 1499, 1498, 1443, 1444, 1500, 1443, 1500, 1499, 1444, 1445, 1501, 1444, 1501, 1500, 1445, 1446, 1502, 1445, 1502, 1501, 1446, 1447, 1503, 1446, 1503, 1502, 1447, 1448, 1504, 1447, 1504, 1503, 1448, 1449, 1505, 1448, 1505, 1504, 1449, 1450, 1506, 1449, 1506, 1505, 1450, 1451, 1507, 1450, 1507, 1506, 1451, 1452, 1508, 1451, 1508, 1507, 1452, 1453, 1509, 1452, 1509, 1508, 1453, 1454, 1510, 1453, 1510, 1509, 1454, 1455, 1511, 1454, 1511, 1510, 1455, 1456, 1512, 1455, 1512, 1511, 1456, 1457, 1513, 1456, 1513, 1512, 1457, 1458, 1514, 1457, 1514, 1513, 1458, 1459, 1515, 1458, 1515, 1514, 1459, 1460, 1516, 1459, 1516, 1515, 1460, 1461, 1517, 1460, 1517, 1516, 1461, 1462, 1518, 1461, 1518, 1517, 1462, 1463, 1519, 1462, 1519, 1518, 1463, 1464, 1520, 1463, 1520, 1519, 1464, 1465, 1521, 1464, 1521, 1520, 1465, 85, 86, 1465, 86, 1521, 25, 1466, 1522, 25, 1522, 26, 1466, 1467, 1523, 1466, 1523, 1522, 1467, 1468, 1524, 1467, 1524, 1523, 1468, 1469, 1525, 1468, 1525, 1524, 1469, 1470, 1526, 1469, 1526, 1525, 1470, 1471, 1527, 1470, 1527, 1526, 1471, 1472, 1528, 1471, 1528, 1527, 1472, 1473, 1529, 1472, 1529, 1528, 1473, 1474, 1530, 1473, 1530, 1529, 1474, 1475, 1531, 1474, 1531, 1530, 1475, 1476, 1532, 1475, 1532, 1531, 1476, 1477, 1533, 1476, 1533, 1532, 1477, 1478, 1534, 1477, 1534, 1533, 1478, 1479, 1535, 1478, 1535, 1534, 1479, 1480, 1536, 1479, 1536, 1535, 1480, 1481, 1537, 1480, 1537, 1536, 1481, 1482, 1538, 1481, 1538, 1537, 1482, 1483, 1539, 1482, 1539, 1538, 1483, 1484, 1540, 1483, 1540, 1539, 1484, 1485, 1541, 1484, 1541, 1540, 1485, 1486, 1542, 1485, 1542, 1541, 1486, 1487, 1543, 1486, 1543, 1542, 1487, 1488, 1544, 1487, 1544, 1543, 1488, 1489, 1545, 1488, 1545, 1544, 1489, 1490, 1546, 1489, 1546, 1545, 1490, 1491, 1547, 1490, 1547, 1546, 1491, 1492, 1548, 1491, 1548, 1547, 1492, 1493, 1549, 1492, 1549, 1548, 1493, 1494, 1550, 1493, 1550, 1549, 1494, 1495, 1551, 1494, 1551, 1550, 1495, 1496, 1552, 1495, 1552, 1551, 1496, 1497, 1553, 1496, 1553, 1552, 1497, 1498, 1554, 1497, 1554, 1553, 1498, 1499, 1555, 1498, 1555, 1554, 1499, 1500, 1556, 1499, 1556, 1555, 1500, 1501, 1557, 1500, 1557, 1556, 1501, 1502, 1558, 1501, 1558, 1557, 1502, 1503, 1559, 1502, 1559, 1558, 1503, 1504, 1560, 1503, 1560, 1559, 1504, 1505, 1561, 1504, 1561, 1560, 1505, 1506, 1562, 1505, 1562, 1561, 1506, 1507, 1563, 1506, 1563, 1562, 1507, 1508, 1564, 1507, 1564, 1563, 1508, 1509, 1565, 1508, 1565, 1564, 1509, 1510, 1566, 1509, 1566, 1565, 1510, 1511, 1567, 1510, 1567, 1566, 1511, 1512, 1568, 1511, 1568, 1567, 1512, 1513, 1569, 1512, 1569, 1568, 1513, 1514, 1570, 1513, 1570, 1569, 1514, 1515, 1571, 1514, 1571, 1570, 1515, 1516, 1572, 1515, 1572, 1571, 1516, 1517, 1573, 1516, 1573, 1572, 1517, 1518, 1574, 1517, 1574, 1573, 1518, 1519, 1575, 1518, 1575, 1574, 1519, 1520, 1576, 1519, 1576, 1575, 1520, 1521, 1577, 1520, 1577, 1576, 1521, 86, 87, 1521, 87, 1577, 26, 1522, 1578, 26, 1578, 27, 1522, 1523, 1579, 1522, 1579, 1578, 1523, 1524, 1580, 1523, 1580, 1579, 1524, 1525, 1581, 1524, 1581, 1580, 1525, 1526, 1582, 1525, 1582, 1581, 1526, 1527, 1583, 1526, 1583, 1582, 1527, 1528, 1584, 1527, 1584, 1583, 1528, 1529, 1585, 1528, 1585, 1584, 1529, 1530, 1586, 1529, 1586, 1585, 1530, 1531, 1587, 1530, 1587, 1586, 1531, 1532, 1588, 1531, 1588, 1587, 1532, 1533, 1589, 1532, 1589, 1588, 1533, 1534, 1590, 1533, 1590, 1589, 1534, 1535, 1591, 1534, 1591, 1590, 1535, 1536, 1592, 1535, 1592, 1591, 1536, 1537, 1593, 1536, 1593, 1592, 1537, 1538, 1594, 1537, 1594, 1593, 1538, 1539, 1595, 1538, 1595, 1594, 1539, 1540, 1596, 1539, 1596, 1595, 1540, 1541, 1597, 1540, 1597, 1596, 1541, 1542, 1598, 1541, 1598, 1597, 1542, 1543, 1599, 1542, 1599, 1598, 1543, 1544, 1600, 1543, 1600, 1599, 1544, 1545, 1601, 1544, 1601, 1600, 1545, 1546, 1602, 1545, 1602, 1601, 1546, 1547, 1603, 1546, 1603, 1602, 1547, 1548, 1604, 1547, 1604, 1603, 1548, 1549, 1605, 1548, 1605, 1604, 1549, 1550, 1606, 1549, 1606, 1605, 1550, 1551, 1607, 1550, 1607, 1606, 1551, 1552, 1608, 1551, 1608, 1607, 1552, 1553, 1609, 1552, 1609, 1608, 1553, 1554, 1610, 1553, 1610, 1609, 1554, 1555, 1611, 1554, 1611, 1610, 1555, 1556, 1612, 1555, 1612, 1611, 1556, 1557, 1613, 1556, 1613, 1612, 1557, 1558, 1614, 1557, 1614, 1613, 1558, 1559, 1615, 1558, 1615, 1614, 1559, 1560, 1616, 1559, 1616, 1615, 1560, 1561, 1617, 1560, 1617, 1616, 1561, 1562, 1618, 1561, 1618, 1617, 1562, 1563, 1619, 1562, 1619, 1618, 1563, 1564, 1620, 1563, 1620, 1619, 1564, 1565, 1621, 1564, 1621, 1620, 1565, 1566, 1622, 1565, 1622, 1621, 1566, 1567, 1623, 1566, 1623, 1622, 1567, 1568, 1624, 1567, 1624, 1623, 1568, 1569, 1625, 1568, 1625, 1624, 1569, 1570, 1626, 1569, 1626, 1625, 1570, 1571, 1627, 1570, 1627, 1626, 1571, 1572, 1628, 1571, 1628, 1627, 1572, 1573, 1629, 1572, 1629, 1628, 1573, 1574, 1630, 1573, 1630, 1629, 1574, 1575, 1631, 1574, 1631, 1630, 1575, 1576, 1632, 1575, 1632, 1631, 1576, 1577, 1633, 1576, 1633, 1632, 1577, 87, 88, 1577, 88, 1633, 27, 1578, 1634, 27, 1634, 28, 1578, 1579, 1635, 1578, 1635, 1634, 1579, 1580, 1636, 1579, 1636, 1635, 1580, 1581, 1637, 1580, 1637, 1636, 1581, 1582, 1638, 1581, 1638, 1637, 1582, 1583, 1639, 1582, 1639, 1638, 1583, 1584, 1640, 1583, 1640, 1639, 1584, 1585, 1641, 1584, 1641, 1640, 1585, 1586, 1642, 1585, 1642, 1641, 1586, 1587, 1643, 1586, 1643, 1642, 1587, 1588, 1644, 1587, 1644, 1643, 1588, 1589, 1645, 1588, 1645, 1644, 1589, 1590, 1646, 1589, 1646, 1645, 1590, 1591, 1647, 1590, 1647, 1646, 1591, 1592, 1648, 1591, 1648, 1647, 1592, 1593, 1649, 1592, 1649, 1648, 1593, 1594, 1650, 1593, 1650, 1649, 1594, 1595, 1651, 1594, 1651, 1650, 1595, 1596, 1652, 1595, 1652, 1651, 1596, 1597, 1653, 1596, 1653, 1652, 1597, 1598, 1654, 1597, 1654, 1653, 1598, 1599, 1655, 1598, 1655, 1654, 1599, 1600, 1656, 1599, 1656, 1655, 1600, 1601, 1657, 1600, 1657, 1656, 1601, 1602, 1658, 1601, 1658, 1657, 1602, 1603, 1659, 1602, 1659, 1658, 1603, 1604, 1660, 1603, 1660, 1659, 1604, 1605, 1661, 1604, 1661, 1660, 1605, 1606, 1662, 1605, 1662, 1661, 1606, 1607, 1663, 1606, 1663, 1662, 1607, 1608, 1664, 1607, 1664, 1663, 1608, 1609, 1665, 1608, 1665, 1664, 1609, 1610, 1666, 1609, 1666, 1665, 1610, 1611, 1667, 1610, 1667, 1666, 1611, 1612, 1668, 1611, 1668, 1667, 1612, 1613, 1669, 1612, 1669, 1668, 1613, 1614, 1670, 1613, 1670, 1669, 1614, 1615, 1671, 1614, 1671, 1670, 1615, 1616, 1672, 1615, 1672, 1671, 1616, 1617, 1673, 1616, 1673, 1672, 1617, 1618, 1674, 1617, 1674, 1673, 1618, 1619, 1675, 1618, 1675, 1674, 1619, 1620, 1676, 1619, 1676, 1675, 1620, 1621, 1677, 1620, 1677, 1676, 1621, 1622, 1678, 1621, 1678, 1677, 1622, 1623, 1679, 1622, 1679, 1678, 1623, 1624, 1680, 1623, 1680, 1679, 1624, 1625, 1681, 1624, 1681, 1680, 1625, 1626, 1682, 1625, 1682, 1681, 1626, 1627, 1683, 1626, 1683, 1682, 1627, 1628, 1684, 1627, 1684, 1683, 1628, 1629, 1685, 1628, 1685, 1684, 1629, 1630, 1686, 1629, 1686, 1685, 1630, 1631, 1687, 1630, 1687, 1686, 1631, 1632, 1688, 1631, 1688, 1687, 1632, 1633, 1689, 1632, 1689, 1688, 1633, 88, 89, 1633, 89, 1689, 28, 1634, 1690, 28, 1690, 29, 1634, 1635, 1691, 1634, 1691, 1690, 1635, 1636, 1692, 1635, 1692, 1691, 1636, 1637, 1693, 1636, 1693, 1692, 1637, 1638, 1694, 1637, 1694, 1693, 1638, 1639, 1695, 1638, 1695, 1694, 1639, 1640, 1696, 1639, 1696, 1695, 1640, 1641, 1697, 1640, 1697, 1696, 1641, 1642, 1698, 1641, 1698, 1697, 1642, 1643, 1699, 1642, 1699, 1698, 1643, 1644, 1700, 1643, 1700, 1699, 1644, 1645, 1701, 1644, 1701, 1700, 1645, 1646, 1702, 1645, 1702, 1701, 1646, 1647, 1703, 1646, 1703, 1702, 1647, 1648, 1704, 1647, 1704, 1703, 1648, 1649, 1705, 1648, 1705, 1704, 1649, 1650, 1706, 1649, 1706, 1705, 1650, 1651, 1707, 1650, 1707, 1706, 1651, 1652, 1708, 1651, 1708, 1707, 1652, 1653, 1709, 1652, 1709, 1708, 1653, 1654, 1710, 1653, 1710, 1709, 1654, 1655, 1711, 1654, 1711, 1710, 1655, 1656, 1712, 1655, 1712, 1711, 1656, 1657, 1713, 1656, 1713, 1712, 1657, 1658, 1714, 1657, 1714, 1713, 1658, 1659, 1715, 1658, 1715, 1714, 1659, 1660, 1716, 1659, 1716, 1715, 1660, 1661, 1717, 1660, 1717, 1716, 1661, 1662, 1718, 1661, 1718, 1717, 1662, 1663, 1719, 1662, 1719, 1718, 1663, 1664, 1720, 1663, 1720, 1719, 1664, 1665, 1721, 1664, 1721, 1720, 1665, 1666, 1722, 1665, 1722, 1721, 1666, 1667, 1723, 1666, 1723, 1722, 1667, 1668, 1724, 1667, 1724, 1723, 1668, 1669, 1725, 1668, 1725, 1724, 1669, 1670, 1726, 1669, 1726, 1725, 1670, 1671, 1727, 1670, 1727, 1726, 1671, 1672, 1728, 1671, 1728, 1727, 1672, 1673, 1729, 1672, 1729, 1728, 1673, 1674, 1730, 1673, 1730, 1729, 1674, 1675, 1731, 1674, 1731, 1730, 1675, 1676, 1732, 1675, 1732, 1731, 1676, 1677, 1733, 1676, 1733, 1732, 1677, 1678, 1734, 1677, 1734, 1733, 1678, 1679, 1735, 1678, 1735, 1734, 1679, 1680, 1736, 1679, 1736, 1735, 1680, 1681, 1737, 1680, 1737, 1736, 1681, 1682, 1738, 1681, 1738, 1737, 1682, 1683, 1739, 1682, 1739, 1738, 1683, 1684, 1740, 1683, 1740, 1739, 1684, 1685, 1741, 1684, 1741, 1740, 1685, 1686, 1742, 1685, 1742, 1741, 1686, 1687, 1743, 1686, 1743, 1742, 1687, 1688, 1744, 1687, 1744, 1743, 1688, 1689, 1745, 1688, 1745, 1744, 1689, 89, 90, 1689, 90, 1745, 29, 1690, 1746, 29, 1746, 30, 1690, 1691, 1747, 1690, 1747, 1746, 1691, 1692, 1748, 1691, 1748, 1747, 1692, 1693, 1749, 1692, 1749, 1748, 1693, 1694, 1750, 1693, 1750, 1749, 1694, 1695, 1751, 1694, 1751, 1750, 1695, 1696, 1752, 1695, 1752, 1751, 1696, 1697, 1753, 1696, 1753, 1752, 1697, 1698, 1754, 1697, 1754, 1753, 1698, 1699, 1755, 1698, 1755, 1754, 1699, 1700, 1756, 1699, 1756, 1755, 1700, 1701, 1757, 1700, 1757, 1756, 1701, 1702, 1758, 1701, 1758, 1757, 1702, 1703, 1759, 1702, 1759, 1758, 1703, 1704, 1760, 1703, 1760, 1759, 1704, 1705, 1761, 1704, 1761, 1760, 1705, 1706, 1762, 1705, 1762, 1761, 1706, 1707, 1763, 1706, 1763, 1762, 1707, 1708, 1764, 1707, 1764, 1763, 1708, 1709, 1765, 1708, 1765, 1764, 1709, 1710, 1766, 1709, 1766, 1765, 1710, 1711, 1767, 1710, 1767, 1766, 1711, 1712, 1768, 1711, 1768, 1767, 1712, 1713, 1769, 1712, 1769, 1768, 1713, 1714, 1770, 1713, 1770, 1769, 1714, 1715, 1771, 1714, 1771, 1770, 1715, 1716, 1772, 1715, 1772, 1771, 1716, 1717, 1773, 1716, 1773, 1772, 1717, 1718, 1774, 1717, 1774, 1773, 1718, 1719, 1775, 1718, 1775, 1774, 1719, 1720, 1776, 1719, 1776, 1775, 1720, 1721, 1777, 1720, 1777, 1776, 1721, 1722, 1778, 1721, 1778, 1777, 1722, 1723, 1779, 1722, 1779, 1778, 1723, 1724, 1780, 1723, 1780, 1779, 1724, 1725, 1781, 1724, 1781, 1780, 1725, 1726, 1782, 1725, 1782, 1781, 1726, 1727, 1783, 1726, 1783, 1782, 1727, 1728, 1784, 1727, 1784, 1783, 1728, 1729, 1785, 1728, 1785, 1784, 1729, 1730, 1786, 1729, 1786, 1785, 1730, 1731, 1787, 1730, 1787, 1786, 1731, 1732, 1788, 1731, 1788, 1787, 1732, 1733, 1789, 1732, 1789, 1788, 1733, 1734, 1790, 1733, 1790, 1789, 1734, 1735, 1791, 1734, 1791, 1790, 1735, 1736, 1792, 1735, 1792, 1791, 1736, 1737, 1793, 1736, 1793, 1792, 1737, 1738, 1794, 1737, 1794, 1793, 1738, 1739, 1795, 1738, 1795, 1794, 1739, 1740, 1796, 1739, 1796, 1795, 1740, 1741, 1797, 1740, 1797, 1796, 1741, 1742, 1798, 1741, 1798, 1797, 1742, 1743, 1799, 1742, 1799, 1798, 1743, 1744, 1800, 1743, 1800, 1799, 1744, 1745, 1801, 1744, 1801, 1800, 1745, 90, 91, 1745, 91, 1801, 30, 1746, 1802, 30, 1802, 31, 1746, 1747, 1803, 1746, 1803, 1802, 1747, 1748, 1804, 1747, 1804, 1803, 1748, 1749, 1805, 1748, 1805, 1804, 1749, 1750, 1806, 1749, 1806, 1805, 1750, 1751, 1807, 1750, 1807, 1806, 1751, 1752, 1808, 1751, 1808, 1807, 1752, 1753, 1809, 1752, 1809, 1808, 1753, 1754, 1810, 1753, 1810, 1809, 1754, 1755, 1811, 1754, 1811, 1810, 1755, 1756, 1812, 1755, 1812, 1811, 1756, 1757, 1813, 1756, 1813, 1812, 1757, 1758, 1814, 1757, 1814, 1813, 1758, 1759, 1815, 1758, 1815, 1814, 1759, 1760, 1816, 1759, 1816, 1815, 1760, 1761, 1817, 1760, 1817, 1816, 1761, 1762, 1818, 1761, 1818, 1817, 1762, 1763, 1819, 1762, 1819, 1818, 1763, 1764, 1820, 1763, 1820, 1819, 1764, 1765, 1821, 1764, 1821, 1820, 1765, 1766, 1822, 1765, 1822, 1821, 1766, 1767, 1823, 1766, 1823, 1822, 1767, 1768, 1824, 1767, 1824, 1823, 1768, 1769, 1825, 1768, 1825, 1824, 1769, 1770, 1826, 1769, 1826, 1825, 1770, 1771, 1827, 1770, 1827, 1826, 1771, 1772, 1828, 1771, 1828, 1827, 1772, 1773, 1829, 1772, 1829, 1828, 1773, 1774, 1830, 1773, 1830, 1829, 1774, 1775, 1831, 1774, 1831, 1830, 1775, 1776, 1832, 1775, 1832, 1831, 1776, 1777, 1833, 1776, 1833, 1832, 1777, 1778, 1834, 1777, 1834, 1833, 1778, 1779, 1835, 1778, 1835, 1834, 1779, 1780, 1836, 1779, 1836, 1835, 1780, 1781, 1837, 1780, 1837, 1836, 1781, 1782, 1838, 1781, 1838, 1837, 1782, 1783, 1839, 1782, 1839, 1838, 1783, 1784, 1840, 1783, 1840, 1839, 1784, 1785, 1841, 1784, 1841, 1840, 1785, 1786, 1842, 1785, 1842, 1841, 1786, 1787, 1843, 1786, 1843, 1842, 1787, 1788, 1844, 1787, 1844, 1843, 1788, 1789, 1845, 1788, 1845, 1844, 1789, 1790, 1846, 1789, 1846, 1845, 1790, 1791, 1847, 1790, 1847, 1846, 1791, 1792, 1848, 1791, 1848, 1847, 1792, 1793, 1849, 1792, 1849, 1848, 1793, 1794, 1850, 1793, 1850, 1849, 1794, 1795, 1851, 1794, 1851, 1850, 1795, 1796, 1852, 1795, 1852, 1851, 1796, 1797, 1853, 1796, 1853, 1852, 1797, 1798, 1854, 1797, 1854, 1853, 1798, 1799, 1855, 1798, 1855, 1854, 1799, 1800, 1856, 1799, 1856, 1855, 1800, 1801, 1857, 1800, 1857, 1856, 1801, 91, 92, 1801, 92, 1857, 31, 1802, 1858, 31, 1858, 32, 1802, 1803, 1859, 1802, 1859, 1858, 1803, 1804, 1860, 1803, 1860, 1859, 1804, 1805, 1861, 1804, 1861, 1860, 1805, 1806, 1862, 1805, 1862, 1861, 1806, 1807, 1863, 1806, 1863, 1862, 1807, 1808, 1864, 1807, 1864, 1863, 1808, 1809, 1865, 1808, 1865, 1864, 1809, 1810, 1866, 1809, 1866, 1865, 1810, 1811, 1867, 1810, 1867, 1866, 1811, 1812, 1868, 1811, 1868, 1867, 1812, 1813, 1869, 1812, 1869, 1868, 1813, 1814, 1870, 1813, 1870, 1869, 1814, 1815, 1871, 1814, 1871, 1870, 1815, 1816, 1872, 1815, 1872, 1871, 1816, 1817, 1873, 1816, 1873, 1872, 1817, 1818, 1874, 1817, 1874, 1873, 1818, 1819, 1875, 1818, 1875, 1874, 1819, 1820, 1876, 1819, 1876, 1875, 1820, 1821, 1877, 1820, 1877, 1876, 1821, 1822, 1878, 1821, 1878, 1877, 1822, 1823, 1879, 1822, 1879, 1878, 1823, 1824, 1880, 1823, 1880, 1879, 1824, 1825, 1881, 1824, 1881, 1880, 1825, 1826, 1882, 1825, 1882, 1881, 1826, 1827, 1883, 1826, 1883, 1882, 1827, 1828, 1884, 1827, 1884, 1883, 1828, 1829, 1885, 1828, 1885, 1884, 1829, 1830, 1886, 1829, 1886, 1885, 1830, 1831, 1887, 1830, 1887, 1886, 1831, 1832, 1888, 1831, 1888, 1887, 1832, 1833, 1889, 1832, 1889, 1888, 1833, 1834, 1890, 1833, 1890, 1889, 1834, 1835, 1891, 1834, 1891, 1890, 1835, 1836, 1892, 1835, 1892, 1891, 1836, 1837, 1893, 1836, 1893, 1892, 1837, 1838, 1894, 1837, 1894, 1893, 1838, 1839, 1895, 1838, 1895, 1894, 1839, 1840, 1896, 1839, 1896, 1895, 1840, 1841, 1897, 1840, 1897, 1896, 1841, 1842, 1898, 1841, 1898, 1897, 1842, 1843, 1899, 1842, 1899, 1898, 1843, 1844, 1900, 1843, 1900, 1899, 1844, 1845, 1901, 1844, 1901, 1900, 1845, 1846, 1902, 1845, 1902, 1901, 1846, 1847, 1903, 1846, 1903, 1902, 1847, 1848, 1904, 1847, 1904, 1903, 1848, 1849, 1905, 1848, 1905, 1904, 1849, 1850, 1906, 1849, 1906, 1905, 1850, 1851, 1907, 1850, 1907, 1906, 1851, 1852, 1908, 1851, 1908, 1907, 1852, 1853, 1909, 1852, 1909, 1908, 1853, 1854, 1910, 1853, 1910, 1909, 1854, 1855, 1911, 1854, 1911, 1910, 1855, 1856, 1912, 1855, 1912, 1911, 1856, 1857, 1913, 1856, 1913, 1912, 1857, 92, 93, 1857, 93, 1913, 32, 1858, 1914, 32, 1914, 33, 1858, 1859, 1915, 1858, 1915, 1914, 1859, 1860, 1916, 1859, 1916, 1915, 1860, 1861, 1917, 1860, 1917, 1916, 1861, 1862, 1918, 1861, 1918, 1917, 1862, 1863, 1919, 1862, 1919, 1918, 1863, 1864, 1920, 1863, 1920, 1919, 1864, 1865, 1921, 1864, 1921, 1920, 1865, 1866, 1922, 1865, 1922, 1921, 1866, 1867, 1923, 1866, 1923, 1922, 1867, 1868, 1924, 1867, 1924, 1923, 1868, 1869, 1925, 1868, 1925, 1924, 1869, 1870, 1926, 1869, 1926, 1925, 1870, 1871, 1927, 1870, 1927, 1926, 1871, 1872, 1928, 1871, 1928, 1927, 1872, 1873, 1929, 1872, 1929, 1928, 1873, 1874, 1930, 1873, 1930, 1929, 1874, 1875, 1931, 1874, 1931, 1930, 1875, 1876, 1932, 1875, 1932, 1931, 1876, 1877, 1933, 1876, 1933, 1932, 1877, 1878, 1934, 1877, 1934, 1933, 1878, 1879, 1935, 1878, 1935, 1934, 1879, 1880, 1936, 1879, 1936, 1935, 1880, 1881, 1937, 1880, 1937, 1936, 1881, 1882, 1938, 1881, 1938, 1937, 1882, 1883, 1939, 1882, 1939, 1938, 1883, 1884, 1940, 1883, 1940, 1939, 1884, 1885, 1941, 1884, 1941, 1940, 1885, 1886, 1942, 1885, 1942, 1941, 1886, 1887, 1943, 1886, 1943, 1942, 1887, 1888, 1944, 1887, 1944, 1943, 1888, 1889, 1945, 1888, 1945, 1944, 1889, 1890, 1946, 1889, 1946, 1945, 1890, 1891, 1947, 1890, 1947, 1946, 1891, 1892, 1948, 1891, 1948, 1947, 1892, 1893, 1949, 1892, 1949, 1948, 1893, 1894, 1950, 1893, 1950, 1949, 1894, 1895, 1951, 1894, 1951, 1950, 1895, 1896, 1952, 1895, 1952, 1951, 1896, 1897, 1953, 1896, 1953, 1952, 1897, 1898, 1954, 1897, 1954, 1953, 1898, 1899, 1955, 1898, 1955, 1954, 1899, 1900, 1956, 1899, 1956, 1955, 1900, 1901, 1957, 1900, 1957, 1956, 1901, 1902, 1958, 1901, 1958, 1957, 1902, 1903, 1959, 1902, 1959, 1958, 1903, 1904, 1960, 1903, 1960, 1959, 1904, 1905, 1961, 1904, 1961, 1960, 1905, 1906, 1962, 1905, 1962, 1961, 1906, 1907, 1963, 1906, 1963, 1962, 1907, 1908, 1964, 1907, 1964, 1963, 1908, 1909, 1965, 1908, 1965, 1964, 1909, 1910, 1966, 1909, 1966, 1965, 1910, 1911, 1967, 1910, 1967, 1966, 1911, 1912, 1968, 1911, 1968, 1967, 1912, 1913, 1969, 1912, 1969, 1968, 1913, 93, 94, 1913, 94, 1969, 33, 1914, 1970, 33, 1970, 34, 1914, 1915, 1971, 1914, 1971, 1970, 1915, 1916, 1972, 1915, 1972, 1971, 1916, 1917, 1973, 1916, 1973, 1972, 1917, 1918, 1974, 1917, 1974, 1973, 1918, 1919, 1975, 1918, 1975, 1974, 1919, 1920, 1976, 1919, 1976, 1975, 1920, 1921, 1977, 1920, 1977, 1976, 1921, 1922, 1978, 1921, 1978, 1977, 1922, 1923, 1979, 1922, 1979, 1978, 1923, 1924, 1980, 1923, 1980, 1979, 1924, 1925, 1981, 1924, 1981, 1980, 1925, 1926, 1982, 1925, 1982, 1981, 1926, 1927, 1983, 1926, 1983, 1982, 1927, 1928, 1984, 1927, 1984, 1983, 1928, 1929, 1985, 1928, 1985, 1984, 1929, 1930, 1986, 1929, 1986, 1985, 1930, 1931, 1987, 1930, 1987, 1986, 1931, 1932, 1988, 1931, 1988, 1987, 1932, 1933, 1989, 1932, 1989, 1988, 1933, 1934, 1990, 1933, 1990, 1989, 1934, 1935, 1991, 1934, 1991, 1990, 1935, 1936, 1992, 1935, 1992, 1991, 1936, 1937, 1993, 1936, 1993, 1992, 1937, 1938, 1994, 1937, 1994, 1993, 1938, 1939, 1995, 1938, 1995, 1994, 1939, 1940, 1996, 1939, 1996, 1995, 1940, 1941, 1997, 1940, 1997, 1996, 1941, 1942, 1998, 1941, 1998, 1997, 1942, 1943, 1999, 1942, 1999, 1998, 1943, 1944, 2000, 1943, 2000, 1999, 1944, 1945, 2001, 1944, 2001, 2000, 1945, 1946, 2002, 1945, 2002, 2001, 1946, 1947, 2003, 1946, 2003, 2002, 1947, 1948, 2004, 1947, 2004, 2003, 1948, 1949, 2005, 1948, 2005, 2004, 1949, 1950, 2006, 1949, 2006, 2005, 1950, 1951, 2007, 1950, 2007, 2006, 1951, 1952, 2008, 1951, 2008, 2007, 1952, 1953, 2009, 1952, 2009, 2008, 1953, 1954, 2010, 1953, 2010, 2009, 1954, 1955, 2011, 1954, 2011, 2010, 1955, 1956, 2012, 1955, 2012, 2011, 1956, 1957, 2013, 1956, 2013, 2012, 1957, 1958, 2014, 1957, 2014, 2013, 1958, 1959, 2015, 1958, 2015, 2014, 1959, 1960, 2016, 1959, 2016, 2015, 1960, 1961, 2017, 1960, 2017, 2016, 1961, 1962, 2018, 1961, 2018, 2017, 1962, 1963, 2019, 1962, 2019, 2018, 1963, 1964, 2020, 1963, 2020, 2019, 1964, 1965, 2021, 1964, 2021, 2020, 1965, 1966, 2022, 1965, 2022, 2021, 1966, 1967, 2023, 1966, 2023, 2022, 1967, 1968, 2024, 1967, 2024, 2023, 1968, 1969, 2025, 1968, 2025, 2024, 1969, 94, 95, 1969, 95, 2025, 34, 1970, 2026, 34, 2026, 35, 1970, 1971, 2027, 1970, 2027, 2026, 1971, 1972, 2028, 1971, 2028, 2027, 1972, 1973, 2029, 1972, 2029, 2028, 1973, 1974, 2030, 1973, 2030, 2029, 1974, 1975, 2031, 1974, 2031, 2030, 1975, 1976, 2032, 1975, 2032, 2031, 1976, 1977, 2033, 1976, 2033, 2032, 1977, 1978, 2034, 1977, 2034, 2033, 1978, 1979, 2035, 1978, 2035, 2034, 1979, 1980, 2036, 1979, 2036, 2035, 1980, 1981, 2037, 1980, 2037, 2036, 1981, 1982, 2038, 1981, 2038, 2037, 1982, 1983, 2039, 1982, 2039, 2038, 1983, 1984, 2040, 1983, 2040, 2039, 1984, 1985, 2041, 1984, 2041, 2040, 1985, 1986, 2042, 1985, 2042, 2041, 1986, 1987, 2043, 1986, 2043, 2042, 1987, 1988, 2044, 1987, 2044, 2043, 1988, 1989, 2045, 1988, 2045, 2044, 1989, 1990, 2046, 1989, 2046, 2045, 1990, 1991, 2047, 1990, 2047, 2046, 1991, 1992, 2048, 1991, 2048, 2047, 1992, 1993, 2049, 1992, 2049, 2048, 1993, 1994, 2050, 1993, 2050, 2049, 1994, 1995, 2051, 1994, 2051, 2050, 1995, 1996, 2052, 1995, 2052, 2051, 1996, 1997, 2053, 1996, 2053, 2052, 1997, 1998, 2054, 1997, 2054, 2053, 1998, 1999, 2055, 1998, 2055, 2054, 1999, 2000, 2056, 1999, 2056, 2055, 2000, 2001, 2057, 2000, 2057, 2056, 2001, 2002, 2058, 2001, 2058, 2057, 2002, 2003, 2059, 2002, 2059, 2058, 2003, 2004, 2060, 2003, 2060, 2059, 2004, 2005, 2061, 2004, 2061, 2060, 2005, 2006, 2062, 2005, 2062, 2061, 2006, 2007, 2063, 2006, 2063, 2062, 2007, 2008, 2064, 2007, 2064, 2063, 2008, 2009, 2065, 2008, 2065, 2064, 2009, 2010, 2066, 2009, 2066, 2065, 2010, 2011, 2067, 2010, 2067, 2066, 2011, 2012, 2068, 2011, 2068, 2067, 2012, 2013, 2069, 2012, 2069, 2068, 2013, 2014, 2070, 2013, 2070, 2069, 2014, 2015, 2071, 2014, 2071, 2070, 2015, 2016, 2072, 2015, 2072, 2071, 2016, 2017, 2073, 2016, 2073, 2072, 2017, 2018, 2074, 2017, 2074, 2073, 2018, 2019, 2075, 2018, 2075, 2074, 2019, 2020, 2076, 2019, 2076, 2075, 2020, 2021, 2077, 2020, 2077, 2076, 2021, 2022, 2078, 2021, 2078, 2077, 2022, 2023, 2079, 2022, 2079, 2078, 2023, 2024, 2080, 2023, 2080, 2079, 2024, 2025, 2081, 2024, 2081, 2080, 2025, 95, 96, 2025, 96, 2081, 35, 2026, 2082, 35, 2082, 36, 2026, 2027, 2083, 2026, 2083, 2082, 2027, 2028, 2084, 2027, 2084, 2083, 2028, 2029, 2085, 2028, 2085, 2084, 2029, 2030, 2086, 2029, 2086, 2085, 2030, 2031, 2087, 2030, 2087, 2086, 2031, 2032, 2088, 2031, 2088, 2087, 2032, 2033, 2089, 2032, 2089, 2088, 2033, 2034, 2090, 2033, 2090, 2089, 2034, 2035, 2091, 2034, 2091, 2090, 2035, 2036, 2092, 2035, 2092, 2091, 2036, 2037, 2093, 2036, 2093, 2092, 2037, 2038, 2094, 2037, 2094, 2093, 2038, 2039, 2095, 2038, 2095, 2094, 2039, 2040, 2096, 2039, 2096, 2095, 2040, 2041, 2097, 2040, 2097, 2096, 2041, 2042, 2098, 2041, 2098, 2097, 2042, 2043, 2099, 2042, 2099, 2098, 2043, 2044, 2100, 2043, 2100, 2099, 2044, 2045, 2101, 2044, 2101, 2100, 2045, 2046, 2102, 2045, 2102, 2101, 2046, 2047, 2103, 2046, 2103, 2102, 2047, 2048, 2104, 2047, 2104, 2103, 2048, 2049, 2105, 2048, 2105, 2104, 2049, 2050, 2106, 2049, 2106, 2105, 2050, 2051, 2107, 2050, 2107, 2106, 2051, 2052, 2108, 2051, 2108, 2107, 2052, 2053, 2109, 2052, 2109, 2108, 2053, 2054, 2110, 2053, 2110, 2109, 2054, 2055, 2111, 2054, 2111, 2110, 2055, 2056, 2112, 2055, 2112, 2111, 2056, 2057, 2113, 2056, 2113, 2112, 2057, 2058, 2114, 2057, 2114, 2113, 2058, 2059, 2115, 2058, 2115, 2114, 2059, 2060, 2116, 2059, 2116, 2115, 2060, 2061, 2117, 2060, 2117, 2116, 2061, 2062, 2118, 2061, 2118, 2117, 2062, 2063, 2119, 2062, 2119, 2118, 2063, 2064, 2120, 2063, 2120, 2119, 2064, 2065, 2121, 2064, 2121, 2120, 2065, 2066, 2122, 2065, 2122, 2121, 2066, 2067, 2123, 2066, 2123, 2122, 2067, 2068, 2124, 2067, 2124, 2123, 2068, 2069, 2125, 2068, 2125, 2124, 2069, 2070, 2126, 2069, 2126, 2125, 2070, 2071, 2127, 2070, 2127, 2126, 2071, 2072, 2128, 2071, 2128, 2127, 2072, 2073, 2129, 2072, 2129, 2128, 2073, 2074, 2130, 2073, 2130, 2129, 2074, 2075, 2131, 2074, 2131, 2130, 2075, 2076, 2132, 2075, 2132, 2131, 2076, 2077, 2133, 2076, 2133, 2132, 2077, 2078, 2134, 2077, 2134, 2133, 2078, 2079, 2135, 2078, 2135, 2134, 2079, 2080, 2136, 2079, 2136, 2135, 2080, 2081, 2137, 2080, 2137, 2136, 2081, 96, 97, 2081, 97, 2137, 36, 2082, 2138, 36, 2138, 37, 2082, 2083, 2139, 2082, 2139, 2138, 2083, 2084, 2140, 2083, 2140, 2139, 2084, 2085, 2141, 2084, 2141, 2140, 2085, 2086, 2142, 2085, 2142, 2141, 2086, 2087, 2143, 2086, 2143, 2142, 2087, 2088, 2144, 2087, 2144, 2143, 2088, 2089, 2145, 2088, 2145, 2144, 2089, 2090, 2146, 2089, 2146, 2145, 2090, 2091, 2147, 2090, 2147, 2146, 2091, 2092, 2148, 2091, 2148, 2147, 2092, 2093, 2149, 2092, 2149, 2148, 2093, 2094, 2150, 2093, 2150, 2149, 2094, 2095, 2151, 2094, 2151, 2150, 2095, 2096, 2152, 2095, 2152, 2151, 2096, 2097, 2153, 2096, 2153, 2152, 2097, 2098, 2154, 2097, 2154, 2153, 2098, 2099, 2155, 2098, 2155, 2154, 2099, 2100, 2156, 2099, 2156, 2155, 2100, 2101, 2157, 2100, 2157, 2156, 2101, 2102, 2158, 2101, 2158, 2157, 2102, 2103, 2159, 2102, 2159, 2158, 2103, 2104, 2160, 2103, 2160, 2159, 2104, 2105, 2161, 2104, 2161, 2160, 2105, 2106, 2162, 2105, 2162, 2161, 2106, 2107, 2163, 2106, 2163, 2162, 2107, 2108, 2164, 2107, 2164, 2163, 2108, 2109, 2165, 2108, 2165, 2164, 2109, 2110, 2166, 2109, 2166, 2165, 2110, 2111, 2167, 2110, 2167, 2166, 2111, 2112, 2168, 2111, 2168, 2167, 2112, 2113, 2169, 2112, 2169, 2168, 2113, 2114, 2170, 2113, 2170, 2169, 2114, 2115, 2171, 2114, 2171, 2170, 2115, 2116, 2172, 2115, 2172, 2171, 2116, 2117, 2173, 2116, 2173, 2172, 2117, 2118, 2174, 2117, 2174, 2173, 2118, 2119, 2175, 2118, 2175, 2174, 2119, 2120, 2176, 2119, 2176, 2175, 2120, 2121, 2177, 2120, 2177, 2176, 2121, 2122, 2178, 2121, 2178, 2177, 2122, 2123, 2179, 2122, 2179, 2178, 2123, 2124, 2180, 2123, 2180, 2179, 2124, 2125, 2181, 2124, 2181, 2180, 2125, 2126, 2182, 2125, 2182, 2181, 2126, 2127, 2183, 2126, 2183, 2182, 2127, 2128, 2184, 2127, 2184, 2183, 2128, 2129, 2185, 2128, 2185, 2184, 2129, 2130, 2186, 2129, 2186, 2185, 2130, 2131, 2187, 2130, 2187, 2186, 2131, 2132, 2188, 2131, 2188, 2187, 2132, 2133, 2189, 2132, 2189, 2188, 2133, 2134, 2190, 2133, 2190, 2189, 2134, 2135, 2191, 2134, 2191, 2190, 2135, 2136, 2192, 2135, 2192, 2191, 2136, 2137, 2193, 2136, 2193, 2192, 2137, 97, 98, 2137, 98, 2193, 37, 2138, 2194, 37, 2194, 38, 2138, 2139, 2195, 2138, 2195, 2194, 2139, 2140, 2196, 2139, 2196, 2195, 2140, 2141, 2197, 2140, 2197, 2196, 2141, 2142, 2198, 2141, 2198, 2197, 2142, 2143, 2199, 2142, 2199, 2198, 2143, 2144, 2200, 2143, 2200, 2199, 2144, 2145, 2201, 2144, 2201, 2200, 2145, 2146, 2202, 2145, 2202, 2201, 2146, 2147, 2203, 2146, 2203, 2202, 2147, 2148, 2204, 2147, 2204, 2203, 2148, 2149, 2205, 2148, 2205, 2204, 2149, 2150, 2206, 2149, 2206, 2205, 2150, 2151, 2207, 2150, 2207, 2206, 2151, 2152, 2208, 2151, 2208, 2207, 2152, 2153, 2209, 2152, 2209, 2208, 2153, 2154, 2210, 2153, 2210, 2209, 2154, 2155, 2211, 2154, 2211, 2210, 2155, 2156, 2212, 2155, 2212, 2211, 2156, 2157, 2213, 2156, 2213, 2212, 2157, 2158, 2214, 2157, 2214, 2213, 2158, 2159, 2215, 2158, 2215, 2214, 2159, 2160, 2216, 2159, 2216, 2215, 2160, 2161, 2217, 2160, 2217, 2216, 2161, 2162, 2218, 2161, 2218, 2217, 2162, 2163, 2219, 2162, 2219, 2218, 2163, 2164, 2220, 2163, 2220, 2219, 2164, 2165, 2221, 2164, 2221, 2220, 2165, 2166, 2222, 2165, 2222, 2221, 2166, 2167, 2223, 2166, 2223, 2222, 2167, 2168, 2224, 2167, 2224, 2223, 2168, 2169, 2225, 2168, 2225, 2224, 2169, 2170, 2226, 2169, 2226, 2225, 2170, 2171, 2227, 2170, 2227, 2226, 2171, 2172, 2228, 2171, 2228, 2227, 2172, 2173, 2229, 2172, 2229, 2228, 2173, 2174, 2230, 2173, 2230, 2229, 2174, 2175, 2231, 2174, 2231, 2230, 2175, 2176, 2232, 2175, 2232, 2231, 2176, 2177, 2233, 2176, 2233, 2232, 2177, 2178, 2234, 2177, 2234, 2233, 2178, 2179, 2235, 2178, 2235, 2234, 2179, 2180, 2236, 2179, 2236, 2235, 2180, 2181, 2237, 2180, 2237, 2236, 2181, 2182, 2238, 2181, 2238, 2237, 2182, 2183, 2239, 2182, 2239, 2238, 2183, 2184, 2240, 2183, 2240, 2239, 2184, 2185, 2241, 2184, 2241, 2240, 2185, 2186, 2242, 2185, 2242, 2241, 2186, 2187, 2243, 2186, 2243, 2242, 2187, 2188, 2244, 2187, 2244, 2243, 2188, 2189, 2245, 2188, 2245, 2244, 2189, 2190, 2246, 2189, 2246, 2245, 2190, 2191, 2247, 2190, 2247, 2246, 2191, 2192, 2248, 2191, 2248, 2247, 2192, 2193, 2249, 2192, 2249, 2248, 2193, 98, 99, 2193, 99, 2249, 38, 2194, 2250, 38, 2250, 39, 2194, 2195, 2251, 2194, 2251, 2250, 2195, 2196, 2252, 2195, 2252, 2251, 2196, 2197, 2253, 2196, 2253, 2252, 2197, 2198, 2254, 2197, 2254, 2253, 2198, 2199, 2255, 2198, 2255, 2254, 2199, 2200, 2256, 2199, 2256, 2255, 2200, 2201, 2257, 2200, 2257, 2256, 2201, 2202, 2258, 2201, 2258, 2257, 2202, 2203, 2259, 2202, 2259, 2258, 2203, 2204, 2260, 2203, 2260, 2259, 2204, 2205, 2261, 2204, 2261, 2260, 2205, 2206, 2262, 2205, 2262, 2261, 2206, 2207, 2263, 2206, 2263, 2262, 2207, 2208, 2264, 2207, 2264, 2263, 2208, 2209, 2265, 2208, 2265, 2264, 2209, 2210, 2266, 2209, 2266, 2265, 2210, 2211, 2267, 2210, 2267, 2266, 2211, 2212, 2268, 2211, 2268, 2267, 2212, 2213, 2269, 2212, 2269, 2268, 2213, 2214, 2270, 2213, 2270, 2269, 2214, 2215, 2271, 2214, 2271, 2270, 2215, 2216, 2272, 2215, 2272, 2271, 2216, 2217, 2273, 2216, 2273, 2272, 2217, 2218, 2274, 2217, 2274, 2273, 2218, 2219, 2275, 2218, 2275, 2274, 2219, 2220, 2276, 2219, 2276, 2275, 2220, 2221, 2277, 2220, 2277, 2276, 2221, 2222, 2278, 2221, 2278, 2277, 2222, 2223, 2279, 2222, 2279, 2278, 2223, 2224, 2280, 2223, 2280, 2279, 2224, 2225, 2281, 2224, 2281, 2280, 2225, 2226, 2282, 2225, 2282, 2281, 2226, 2227, 2283, 2226, 2283, 2282, 2227, 2228, 2284, 2227, 2284, 2283, 2228, 2229, 2285, 2228, 2285, 2284, 2229, 2230, 2286, 2229, 2286, 2285, 2230, 2231, 2287, 2230, 2287, 2286, 2231, 2232, 2288, 2231, 2288, 2287, 2232, 2233, 2289, 2232, 2289, 2288, 2233, 2234, 2290, 2233, 2290, 2289, 2234, 2235, 2291, 2234, 2291, 2290, 2235, 2236, 2292, 2235, 2292, 2291, 2236, 2237, 2293, 2236, 2293, 2292, 2237, 2238, 2294, 2237, 2294, 2293, 2238, 2239, 2295, 2238, 2295, 2294, 2239, 2240, 2296, 2239, 2296, 2295, 2240, 2241, 2297, 2240, 2297, 2296, 2241, 2242, 2298, 2241, 2298, 2297, 2242, 2243, 2299, 2242, 2299, 2298, 2243, 2244, 2300, 2243, 2300, 2299, 2244, 2245, 2301, 2244, 2301, 2300, 2245, 2246, 2302, 2245, 2302, 2301, 2246, 2247, 2303, 2246, 2303, 2302, 2247, 2248, 2304, 2247, 2304, 2303, 2248, 2249, 2305, 2248, 2305, 2304, 2249, 99, 100, 2249, 100, 2305, 39, 2250, 2306, 39, 2306, 40, 2250, 2251, 2307, 2250, 2307, 2306, 2251, 2252, 2308, 2251, 2308, 2307, 2252, 2253, 2309, 2252, 2309, 2308, 2253, 2254, 2310, 2253, 2310, 2309, 2254, 2255, 2311, 2254, 2311, 2310, 2255, 2256, 2312, 2255, 2312, 2311, 2256, 2257, 2313, 2256, 2313, 2312, 2257, 2258, 2314, 2257, 2314, 2313, 2258, 2259, 2315, 2258, 2315, 2314, 2259, 2260, 2316, 2259, 2316, 2315, 2260, 2261, 2317, 2260, 2317, 2316, 2261, 2262, 2318, 2261, 2318, 2317, 2262, 2263, 2319, 2262, 2319, 2318, 2263, 2264, 2320, 2263, 2320, 2319, 2264, 2265, 2321, 2264, 2321, 2320, 2265, 2266, 2322, 2265, 2322, 2321, 2266, 2267, 2323, 2266, 2323, 2322, 2267, 2268, 2324, 2267, 2324, 2323, 2268, 2269, 2325, 2268, 2325, 2324, 2269, 2270, 2326, 2269, 2326, 2325, 2270, 2271, 2327, 2270, 2327, 2326, 2271, 2272, 2328, 2271, 2328, 2327, 2272, 2273, 2329, 2272, 2329, 2328, 2273, 2274, 2330, 2273, 2330, 2329, 2274, 2275, 2331, 2274, 2331, 2330, 2275, 2276, 2332, 2275, 2332, 2331, 2276, 2277, 2333, 2276, 2333, 2332, 2277, 2278, 2334, 2277, 2334, 2333, 2278, 2279, 2335, 2278, 2335, 2334, 2279, 2280, 2336, 2279, 2336, 2335, 2280, 2281, 2337, 2280, 2337, 2336, 2281, 2282, 2338, 2281, 2338, 2337, 2282, 2283, 2339, 2282, 2339, 2338, 2283, 2284, 2340, 2283, 2340, 2339, 2284, 2285, 2341, 2284, 2341, 2340, 2285, 2286, 2342, 2285, 2342, 2341, 2286, 2287, 2343, 2286, 2343, 2342, 2287, 2288, 2344, 2287, 2344, 2343, 2288, 2289, 2345, 2288, 2345, 2344, 2289, 2290, 2346, 2289, 2346, 2345, 2290, 2291, 2347, 2290, 2347, 2346, 2291, 2292, 2348, 2291, 2348, 2347, 2292, 2293, 2349, 2292, 2349, 2348, 2293, 2294, 2350, 2293, 2350, 2349, 2294, 2295, 2351, 2294, 2351, 2350, 2295, 2296, 2352, 2295, 2352, 2351, 2296, 2297, 2353, 2296, 2353, 2352, 2297, 2298, 2354, 2297, 2354, 2353, 2298, 2299, 2355, 2298, 2355, 2354, 2299, 2300, 2356, 2299, 2356, 2355, 2300, 2301, 2357, 2300, 2357, 2356, 2301, 2302, 2358, 2301, 2358, 2357, 2302, 2303, 2359, 2302, 2359, 2358, 2303, 2304, 2360, 2303, 2360, 2359, 2304, 2305, 2361, 2304, 2361, 2360, 2305, 100, 101, 2305, 101, 2361, 40, 2306, 2362, 40, 2362, 41, 2306, 2307, 2363, 2306, 2363, 2362, 2307, 2308, 2364, 2307, 2364, 2363, 2308, 2309, 2365, 2308, 2365, 2364, 2309, 2310, 2366, 2309, 2366, 2365, 2310, 2311, 2367, 2310, 2367, 2366, 2311, 2312, 2368, 2311, 2368, 2367, 2312, 2313, 2369, 2312, 2369, 2368, 2313, 2314, 2370, 2313, 2370, 2369, 2314, 2315, 2371, 2314, 2371, 2370, 2315, 2316, 2372, 2315, 2372, 2371, 2316, 2317, 2373, 2316, 2373, 2372, 2317, 2318, 2374, 2317, 2374, 2373, 2318, 2319, 2375, 2318, 2375, 2374, 2319, 2320, 2376, 2319, 2376, 2375, 2320, 2321, 2377, 2320, 2377, 2376, 2321, 2322, 2378, 2321, 2378, 2377, 2322, 2323, 2379, 2322, 2379, 2378, 2323, 2324, 2380, 2323, 2380, 2379, 2324, 2325, 2381, 2324, 2381, 2380, 2325, 2326, 2382, 2325, 2382, 2381, 2326, 2327, 2383, 2326, 2383, 2382, 2327, 2328, 2384, 2327, 2384, 2383, 2328, 2329, 2385, 2328, 2385, 2384, 2329, 2330, 2386, 2329, 2386, 2385, 2330, 2331, 2387, 2330, 2387, 2386, 2331, 2332, 2388, 2331, 2388, 2387, 2332, 2333, 2389, 2332, 2389, 2388, 2333, 2334, 2390, 2333, 2390, 2389, 2334, 2335, 2391, 2334, 2391, 2390, 2335, 2336, 2392, 2335, 2392, 2391, 2336, 2337, 2393, 2336, 2393, 2392, 2337, 2338, 2394, 2337, 2394, 2393, 2338, 2339, 2395, 2338, 2395, 2394, 2339, 2340, 2396, 2339, 2396, 2395, 2340, 2341, 2397, 2340, 2397, 2396, 2341, 2342, 2398, 2341, 2398, 2397, 2342, 2343, 2399, 2342, 2399, 2398, 2343, 2344, 2400, 2343, 2400, 2399, 2344, 2345, 2401, 2344, 2401, 2400, 2345, 2346, 2402, 2345, 2402, 2401, 2346, 2347, 2403, 2346, 2403, 2402, 2347, 2348, 2404, 2347, 2404, 2403, 2348, 2349, 2405, 2348, 2405, 2404, 2349, 2350, 2406, 2349, 2406, 2405, 2350, 2351, 2407, 2350, 2407, 2406, 2351, 2352, 2408, 2351, 2408, 2407, 2352, 2353, 2409, 2352, 2409, 2408, 2353, 2354, 2410, 2353, 2410, 2409, 2354, 2355, 2411, 2354, 2411, 2410, 2355, 2356, 2412, 2355, 2412, 2411, 2356, 2357, 2413, 2356, 2413, 2412, 2357, 2358, 2414, 2357, 2414, 2413, 2358, 2359, 2415, 2358, 2415, 2414, 2359, 2360, 2416, 2359, 2416, 2415, 2360, 2361, 2417, 2360, 2417, 2416, 2361, 101, 102, 2361, 102, 2417, 41, 2362, 2418, 41, 2418, 42, 2362, 2363, 2419, 2362, 2419, 2418, 2363, 2364, 2420, 2363, 2420, 2419, 2364, 2365, 2421, 2364, 2421, 2420, 2365, 2366, 2422, 2365, 2422, 2421, 2366, 2367, 2423, 2366, 2423, 2422, 2367, 2368, 2424, 2367, 2424, 2423, 2368, 2369, 2425, 2368, 2425, 2424, 2369, 2370, 2426, 2369, 2426, 2425, 2370, 2371, 2427, 2370, 2427, 2426, 2371, 2372, 2428, 2371, 2428, 2427, 2372, 2373, 2429, 2372, 2429, 2428, 2373, 2374, 2430, 2373, 2430, 2429, 2374, 2375, 2431, 2374, 2431, 2430, 2375, 2376, 2432, 2375, 2432, 2431, 2376, 2377, 2433, 2376, 2433, 2432, 2377, 2378, 2434, 2377, 2434, 2433, 2378, 2379, 2435, 2378, 2435, 2434, 2379, 2380, 2436, 2379, 2436, 2435, 2380, 2381, 2437, 2380, 2437, 2436, 2381, 2382, 2438, 2381, 2438, 2437, 2382, 2383, 2439, 2382, 2439, 2438, 2383, 2384, 2440, 2383, 2440, 2439, 2384, 2385, 2441, 2384, 2441, 2440, 2385, 2386, 2442, 2385, 2442, 2441, 2386, 2387, 2443, 2386, 2443, 2442, 2387, 2388, 2444, 2387, 2444, 2443, 2388, 2389, 2445, 2388, 2445, 2444, 2389, 2390, 2446, 2389, 2446, 2445, 2390, 2391, 2447, 2390, 2447, 2446, 2391, 2392, 2448, 2391, 2448, 2447, 2392, 2393, 2449, 2392, 2449, 2448, 2393, 2394, 2450, 2393, 2450, 2449, 2394, 2395, 2451, 2394, 2451, 2450, 2395, 2396, 2452, 2395, 2452, 2451, 2396, 2397, 2453, 2396, 2453, 2452, 2397, 2398, 2454, 2397, 2454, 2453, 2398, 2399, 2455, 2398, 2455, 2454, 2399, 2400, 2456, 2399, 2456, 2455, 2400, 2401, 2457, 2400, 2457, 2456, 2401, 2402, 2458, 2401, 2458, 2457, 2402, 2403, 2459, 2402, 2459, 2458, 2403, 2404, 2460, 2403, 2460, 2459, 2404, 2405, 2461, 2404, 2461, 2460, 2405, 2406, 2462, 2405, 2462, 2461, 2406, 2407, 2463, 2406, 2463, 2462, 2407, 2408, 2464, 2407, 2464, 2463, 2408, 2409, 2465, 2408, 2465, 2464, 2409, 2410, 2466, 2409, 2466, 2465, 2410, 2411, 2467, 2410, 2467, 2466, 2411, 2412, 2468, 2411, 2468, 2467, 2412, 2413, 2469, 2412, 2469, 2468, 2413, 2414, 2470, 2413, 2470, 2469, 2414, 2415, 2471, 2414, 2471, 2470, 2415, 2416, 2472, 2415, 2472, 2471, 2416, 2417, 2473, 2416, 2473, 2472, 2417, 102, 103, 2417, 103, 2473, 42, 2418, 2474, 42, 2474, 43, 2418, 2419, 2475, 2418, 2475, 2474, 2419, 2420, 2476, 2419, 2476, 2475, 2420, 2421, 2477, 2420, 2477, 2476, 2421, 2422, 2478, 2421, 2478, 2477, 2422, 2423, 2479, 2422, 2479, 2478, 2423, 2424, 2480, 2423, 2480, 2479, 2424, 2425, 2481, 2424, 2481, 2480, 2425, 2426, 2482, 2425, 2482, 2481, 2426, 2427, 2483, 2426, 2483, 2482, 2427, 2428, 2484, 2427, 2484, 2483, 2428, 2429, 2485, 2428, 2485, 2484, 2429, 2430, 2486, 2429, 2486, 2485, 2430, 2431, 2487, 2430, 2487, 2486, 2431, 2432, 2488, 2431, 2488, 2487, 2432, 2433, 2489, 2432, 2489, 2488, 2433, 2434, 2490, 2433, 2490, 2489, 2434, 2435, 2491, 2434, 2491, 2490, 2435, 2436, 2492, 2435, 2492, 2491, 2436, 2437, 2493, 2436, 2493, 2492, 2437, 2438, 2494, 2437, 2494, 2493, 2438, 2439, 2495, 2438, 2495, 2494, 2439, 2440, 2496, 2439, 2496, 2495, 2440, 2441, 2497, 2440, 2497, 2496, 2441, 2442, 2498, 2441, 2498, 2497, 2442, 2443, 2499, 2442, 2499, 2498, 2443, 2444, 2500, 2443, 2500, 2499, 2444, 2445, 2501, 2444, 2501, 2500, 2445, 2446, 2502, 2445, 2502, 2501, 2446, 2447, 2503, 2446, 2503, 2502, 2447, 2448, 2504, 2447, 2504, 2503, 2448, 2449, 2505, 2448, 2505, 2504, 2449, 2450, 2506, 2449, 2506, 2505, 2450, 2451, 2507, 2450, 2507, 2506, 2451, 2452, 2508, 2451, 2508, 2507, 2452, 2453, 2509, 2452, 2509, 2508, 2453, 2454, 2510, 2453, 2510, 2509, 2454, 2455, 2511, 2454, 2511, 2510, 2455, 2456, 2512, 2455, 2512, 2511, 2456, 2457, 2513, 2456, 2513, 2512, 2457, 2458, 2514, 2457, 2514, 2513, 2458, 2459, 2515, 2458, 2515, 2514, 2459, 2460, 2516, 2459, 2516, 2515, 2460, 2461, 2517, 2460, 2517, 2516, 2461, 2462, 2518, 2461, 2518, 2517, 2462, 2463, 2519, 2462, 2519, 2518, 2463, 2464, 2520, 2463, 2520, 2519, 2464, 2465, 2521, 2464, 2521, 2520, 2465, 2466, 2522, 2465, 2522, 2521, 2466, 2467, 2523, 2466, 2523, 2522, 2467, 2468, 2524, 2467, 2524, 2523, 2468, 2469, 2525, 2468, 2525, 2524, 2469, 2470, 2526, 2469, 2526, 2525, 2470, 2471, 2527, 2470, 2527, 2526, 2471, 2472, 2528, 2471, 2528, 2527, 2472, 2473, 2529, 2472, 2529, 2528, 2473, 103, 104, 2473, 104, 2529, 43, 2474, 2530, 43, 2530, 44, 2474, 2475, 2531, 2474, 2531, 2530, 2475, 2476, 2532, 2475, 2532, 2531, 2476, 2477, 2533, 2476, 2533, 2532, 2477, 2478, 2534, 2477, 2534, 2533, 2478, 2479, 2535, 2478, 2535, 2534, 2479, 2480, 2536, 2479, 2536, 2535, 2480, 2481, 2537, 2480, 2537, 2536, 2481, 2482, 2538, 2481, 2538, 2537, 2482, 2483, 2539, 2482, 2539, 2538, 2483, 2484, 2540, 2483, 2540, 2539, 2484, 2485, 2541, 2484, 2541, 2540, 2485, 2486, 2542, 2485, 2542, 2541, 2486, 2487, 2543, 2486, 2543, 2542, 2487, 2488, 2544, 2487, 2544, 2543, 2488, 2489, 2545, 2488, 2545, 2544, 2489, 2490, 2546, 2489, 2546, 2545, 2490, 2491, 2547, 2490, 2547, 2546, 2491, 2492, 2548, 2491, 2548, 2547, 2492, 2493, 2549, 2492, 2549, 2548, 2493, 2494, 2550, 2493, 2550, 2549, 2494, 2495, 2551, 2494, 2551, 2550, 2495, 2496, 2552, 2495, 2552, 2551, 2496, 2497, 2553, 2496, 2553, 2552, 2497, 2498, 2554, 2497, 2554, 2553, 2498, 2499, 2555, 2498, 2555, 2554, 2499, 2500, 2556, 2499, 2556, 2555, 2500, 2501, 2557, 2500, 2557, 2556, 2501, 2502, 2558, 2501, 2558, 2557, 2502, 2503, 2559, 2502, 2559, 2558, 2503, 2504, 2560, 2503, 2560, 2559, 2504, 2505, 2561, 2504, 2561, 2560, 2505, 2506, 2562, 2505, 2562, 2561, 2506, 2507, 2563, 2506, 2563, 2562, 2507, 2508, 2564, 2507, 2564, 2563, 2508, 2509, 2565, 2508, 2565, 2564, 2509, 2510, 2566, 2509, 2566, 2565, 2510, 2511, 2567, 2510, 2567, 2566, 2511, 2512, 2568, 2511, 2568, 2567, 2512, 2513, 2569, 2512, 2569, 2568, 2513, 2514, 2570, 2513, 2570, 2569, 2514, 2515, 2571, 2514, 2571, 2570, 2515, 2516, 2572, 2515, 2572, 2571, 2516, 2517, 2573, 2516, 2573, 2572, 2517, 2518, 2574, 2517, 2574, 2573, 2518, 2519, 2575, 2518, 2575, 2574, 2519, 2520, 2576, 2519, 2576, 2575, 2520, 2521, 2577, 2520, 2577, 2576, 2521, 2522, 2578, 2521, 2578, 2577, 2522, 2523, 2579, 2522, 2579, 2578, 2523, 2524, 2580, 2523, 2580, 2579, 2524, 2525, 2581, 2524, 2581, 2580, 2525, 2526, 2582, 2525, 2582, 2581, 2526, 2527, 2583, 2526, 2583, 2582, 2527, 2528, 2584, 2527, 2584, 2583, 2528, 2529, 2585, 2528, 2585, 2584, 2529, 104, 105, 2529, 105, 2585, 44, 2530, 2586, 44, 2586, 45, 2530, 2531, 2587, 2530, 2587, 2586, 2531, 2532, 2588, 2531, 2588, 2587, 2532, 2533, 2589, 2532, 2589, 2588, 2533, 2534, 2590, 2533, 2590, 2589, 2534, 2535, 2591, 2534, 2591, 2590, 2535, 2536, 2592, 2535, 2592, 2591, 2536, 2537, 2593, 2536, 2593, 2592, 2537, 2538, 2594, 2537, 2594, 2593, 2538, 2539, 2595, 2538, 2595, 2594, 2539, 2540, 2596, 2539, 2596, 2595, 2540, 2541, 2597, 2540, 2597, 2596, 2541, 2542, 2598, 2541, 2598, 2597, 2542, 2543, 2599, 2542, 2599, 2598, 2543, 2544, 2600, 2543, 2600, 2599, 2544, 2545, 2601, 2544, 2601, 2600, 2545, 2546, 2602, 2545, 2602, 2601, 2546, 2547, 2603, 2546, 2603, 2602, 2547, 2548, 2604, 2547, 2604, 2603, 2548, 2549, 2605, 2548, 2605, 2604, 2549, 2550, 2606, 2549, 2606, 2605, 2550, 2551, 2607, 2550, 2607, 2606, 2551, 2552, 2608, 2551, 2608, 2607, 2552, 2553, 2609, 2552, 2609, 2608, 2553, 2554, 2610, 2553, 2610, 2609, 2554, 2555, 2611, 2554, 2611, 2610, 2555, 2556, 2612, 2555, 2612, 2611, 2556, 2557, 2613, 2556, 2613, 2612, 2557, 2558, 2614, 2557, 2614, 2613, 2558, 2559, 2615, 2558, 2615, 2614, 2559, 2560, 2616, 2559, 2616, 2615, 2560, 2561, 2617, 2560, 2617, 2616, 2561, 2562, 2618, 2561, 2618, 2617, 2562, 2563, 2619, 2562, 2619, 2618, 2563, 2564, 2620, 2563, 2620, 2619, 2564, 2565, 2621, 2564, 2621, 2620, 2565, 2566, 2622, 2565, 2622, 2621, 2566, 2567, 2623, 2566, 2623, 2622, 2567, 2568, 2624, 2567, 2624, 2623, 2568, 2569, 2625, 2568, 2625, 2624, 2569, 2570, 2626, 2569, 2626, 2625, 2570, 2571, 2627, 2570, 2627, 2626, 2571, 2572, 2628, 2571, 2628, 2627, 2572, 2573, 2629, 2572, 2629, 2628, 2573, 2574, 2630, 2573, 2630, 2629, 2574, 2575, 2631, 2574, 2631, 2630, 2575, 2576, 2632, 2575, 2632, 2631, 2576, 2577, 2633, 2576, 2633, 2632, 2577, 2578, 2634, 2577, 2634, 2633, 2578, 2579, 2635, 2578, 2635, 2634, 2579, 2580, 2636, 2579, 2636, 2635, 2580, 2581, 2637, 2580, 2637, 2636, 2581, 2582, 2638, 2581, 2638, 2637, 2582, 2583, 2639, 2582, 2639, 2638, 2583, 2584, 2640, 2583, 2640, 2639, 2584, 2585, 2641, 2584, 2641, 2640, 2585, 105, 106, 2585, 106, 2641, 45, 2586, 2642, 45, 2642, 46, 2586, 2587, 2643, 2586, 2643, 2642, 2587, 2588, 2644, 2587, 2644, 2643, 2588, 2589, 2645, 2588, 2645, 2644, 2589, 2590, 2646, 2589, 2646, 2645, 2590, 2591, 2647, 2590, 2647, 2646, 2591, 2592, 2648, 2591, 2648, 2647, 2592, 2593, 2649, 2592, 2649, 2648, 2593, 2594, 2650, 2593, 2650, 2649, 2594, 2595, 2651, 2594, 2651, 2650, 2595, 2596, 2652, 2595, 2652, 2651, 2596, 2597, 2653, 2596, 2653, 2652, 2597, 2598, 2654, 2597, 2654, 2653, 2598, 2599, 2655, 2598, 2655, 2654, 2599, 2600, 2656, 2599, 2656, 2655, 2600, 2601, 2657, 2600, 2657, 2656, 2601, 2602, 2658, 2601, 2658, 2657, 2602, 2603, 2659, 2602, 2659, 2658, 2603, 2604, 2660, 2603, 2660, 2659, 2604, 2605, 2661, 2604, 2661, 2660, 2605, 2606, 2662, 2605, 2662, 2661, 2606, 2607, 2663, 2606, 2663, 2662, 2607, 2608, 2664, 2607, 2664, 2663, 2608, 2609, 2665, 2608, 2665, 2664, 2609, 2610, 2666, 2609, 2666, 2665, 2610, 2611, 2667, 2610, 2667, 2666, 2611, 2612, 2668, 2611, 2668, 2667, 2612, 2613, 2669, 2612, 2669, 2668, 2613, 2614, 2670, 2613, 2670, 2669, 2614, 2615, 2671, 2614, 2671, 2670, 2615, 2616, 2672, 2615, 2672, 2671, 2616, 2617, 2673, 2616, 2673, 2672, 2617, 2618, 2674, 2617, 2674, 2673, 2618, 2619, 2675, 2618, 2675, 2674, 2619, 2620, 2676, 2619, 2676, 2675, 2620, 2621, 2677, 2620, 2677, 2676, 2621, 2622, 2678, 2621, 2678, 2677, 2622, 2623, 2679, 2622, 2679, 2678, 2623, 2624, 2680, 2623, 2680, 2679, 2624, 2625, 2681, 2624, 2681, 2680, 2625, 2626, 2682, 2625, 2682, 2681, 2626, 2627, 2683, 2626, 2683, 2682, 2627, 2628, 2684, 2627, 2684, 2683, 2628, 2629, 2685, 2628, 2685, 2684, 2629, 2630, 2686, 2629, 2686, 2685, 2630, 2631, 2687, 2630, 2687, 2686, 2631, 2632, 2688, 2631, 2688, 2687, 2632, 2633, 2689, 2632, 2689, 2688, 2633, 2634, 2690, 2633, 2690, 2689, 2634, 2635, 2691, 2634, 2691, 2690, 2635, 2636, 2692, 2635, 2692, 2691, 2636, 2637, 2693, 2636, 2693, 2692, 2637, 2638, 2694, 2637, 2694, 2693, 2638, 2639, 2695, 2638, 2695, 2694, 2639, 2640, 2696, 2639, 2696, 2695, 2640, 2641, 2697, 2640, 2697, 2696, 2641, 106, 107, 2641, 107, 2697, 46, 2642, 2698, 46, 2698, 47, 2642, 2643, 2699, 2642, 2699, 2698, 2643, 2644, 2700, 2643, 2700, 2699, 2644, 2645, 2701, 2644, 2701, 2700, 2645, 2646, 2702, 2645, 2702, 2701, 2646, 2647, 2703, 2646, 2703, 2702, 2647, 2648, 2704, 2647, 2704, 2703, 2648, 2649, 2705, 2648, 2705, 2704, 2649, 2650, 2706, 2649, 2706, 2705, 2650, 2651, 2707, 2650, 2707, 2706, 2651, 2652, 2708, 2651, 2708, 2707, 2652, 2653, 2709, 2652, 2709, 2708, 2653, 2654, 2710, 2653, 2710, 2709, 2654, 2655, 2711, 2654, 2711, 2710, 2655, 2656, 2712, 2655, 2712, 2711, 2656, 2657, 2713, 2656, 2713, 2712, 2657, 2658, 2714, 2657, 2714, 2713, 2658, 2659, 2715, 2658, 2715, 2714, 2659, 2660, 2716, 2659, 2716, 2715, 2660, 2661, 2717, 2660, 2717, 2716, 2661, 2662, 2718, 2661, 2718, 2717, 2662, 2663, 2719, 2662, 2719, 2718, 2663, 2664, 2720, 2663, 2720, 2719, 2664, 2665, 2721, 2664, 2721, 2720, 2665, 2666, 2722, 2665, 2722, 2721, 2666, 2667, 2723, 2666, 2723, 2722, 2667, 2668, 2724, 2667, 2724, 2723, 2668, 2669, 2725, 2668, 2725, 2724, 2669, 2670, 2726, 2669, 2726, 2725, 2670, 2671, 2727, 2670, 2727, 2726, 2671, 2672, 2728, 2671, 2728, 2727, 2672, 2673, 2729, 2672, 2729, 2728, 2673, 2674, 2730, 2673, 2730, 2729, 2674, 2675, 2731, 2674, 2731, 2730, 2675, 2676, 2732, 2675, 2732, 2731, 2676, 2677, 2733, 2676, 2733, 2732, 2677, 2678, 2734, 2677, 2734, 2733, 2678, 2679, 2735, 2678, 2735, 2734, 2679, 2680, 2736, 2679, 2736, 2735, 2680, 2681, 2737, 2680, 2737, 2736, 2681, 2682, 2738, 2681, 2738, 2737, 2682, 2683, 2739, 2682, 2739, 2738, 2683, 2684, 2740, 2683, 2740, 2739, 2684, 2685, 2741, 2684, 2741, 2740, 2685, 2686, 2742, 2685, 2742, 2741, 2686, 2687, 2743, 2686, 2743, 2742, 2687, 2688, 2744, 2687, 2744, 2743, 2688, 2689, 2745, 2688, 2745, 2744, 2689, 2690, 2746, 2689, 2746, 2745, 2690, 2691, 2747, 2690, 2747, 2746, 2691, 2692, 2748, 2691, 2748, 2747, 2692, 2693, 2749, 2692, 2749, 2748, 2693, 2694, 2750, 2693, 2750, 2749, 2694, 2695, 2751, 2694, 2751, 2750, 2695, 2696, 2752, 2695, 2752, 2751, 2696, 2697, 2753, 2696, 2753, 2752, 2697, 107, 108, 2697, 108, 2753, 47, 2698, 2754, 47, 2754, 48, 2698, 2699, 2755, 2698, 2755, 2754, 2699, 2700, 2756, 2699, 2756, 2755, 2700, 2701, 2757, 2700, 2757, 2756, 2701, 2702, 2758, 2701, 2758, 2757, 2702, 2703, 2759, 2702, 2759, 2758, 2703, 2704, 2760, 2703, 2760, 2759, 2704, 2705, 2761, 2704, 2761, 2760, 2705, 2706, 2762, 2705, 2762, 2761, 2706, 2707, 2763, 2706, 2763, 2762, 2707, 2708, 2764, 2707, 2764, 2763, 2708, 2709, 2765, 2708, 2765, 2764, 2709, 2710, 2766, 2709, 2766, 2765, 2710, 2711, 2767, 2710, 2767, 2766, 2711, 2712, 2768, 2711, 2768, 2767, 2712, 2713, 2769, 2712, 2769, 2768, 2713, 2714, 2770, 2713, 2770, 2769, 2714, 2715, 2771, 2714, 2771, 2770, 2715, 2716, 2772, 2715, 2772, 2771, 2716, 2717, 2773, 2716, 2773, 2772, 2717, 2718, 2774, 2717, 2774, 2773, 2718, 2719, 2775, 2718, 2775, 2774, 2719, 2720, 2776, 2719, 2776, 2775, 2720, 2721, 2777, 2720, 2777, 2776, 2721, 2722, 2778, 2721, 2778, 2777, 2722, 2723, 2779, 2722, 2779, 2778, 2723, 2724, 2780, 2723, 2780, 2779, 2724, 2725, 2781, 2724, 2781, 2780, 2725, 2726, 2782, 2725, 2782, 2781, 2726, 2727, 2783, 2726, 2783, 2782, 2727, 2728, 2784, 2727, 2784, 2783, 2728, 2729, 2785, 2728, 2785, 2784, 2729, 2730, 2786, 2729, 2786, 2785, 2730, 2731, 2787, 2730, 2787, 2786, 2731, 2732, 2788, 2731, 2788, 2787, 2732, 2733, 2789, 2732, 2789, 2788, 2733, 2734, 2790, 2733, 2790, 2789, 2734, 2735, 2791, 2734, 2791, 2790, 2735, 2736, 2792, 2735, 2792, 2791, 2736, 2737, 2793, 2736, 2793, 2792, 2737, 2738, 2794, 2737, 2794, 2793, 2738, 2739, 2795, 2738, 2795, 2794, 2739, 2740, 2796, 2739, 2796, 2795, 2740, 2741, 2797, 2740, 2797, 2796, 2741, 2742, 2798, 2741, 2798, 2797, 2742, 2743, 2799, 2742, 2799, 2798, 2743, 2744, 2800, 2743, 2800, 2799, 2744, 2745, 2801, 2744, 2801, 2800, 2745, 2746, 2802, 2745, 2802, 2801, 2746, 2747, 2803, 2746, 2803, 2802, 2747, 2748, 2804, 2747, 2804, 2803, 2748, 2749, 2805, 2748, 2805, 2804, 2749, 2750, 2806, 2749, 2806, 2805, 2750, 2751, 2807, 2750, 2807, 2806, 2751, 2752, 2808, 2751, 2808, 2807, 2752, 2753, 2809, 2752, 2809, 2808, 2753, 108, 109, 2753, 109, 2809, 48, 2754, 2810, 48, 2810, 49, 2754, 2755, 2811, 2754, 2811, 2810, 2755, 2756, 2812, 2755, 2812, 2811, 2756, 2757, 2813, 2756, 2813, 2812, 2757, 2758, 2814, 2757, 2814, 2813, 2758, 2759, 2815, 2758, 2815, 2814, 2759, 2760, 2816, 2759, 2816, 2815, 2760, 2761, 2817, 2760, 2817, 2816, 2761, 2762, 2818, 2761, 2818, 2817, 2762, 2763, 2819, 2762, 2819, 2818, 2763, 2764, 2820, 2763, 2820, 2819, 2764, 2765, 2821, 2764, 2821, 2820, 2765, 2766, 2822, 2765, 2822, 2821, 2766, 2767, 2823, 2766, 2823, 2822, 2767, 2768, 2824, 2767, 2824, 2823, 2768, 2769, 2825, 2768, 2825, 2824, 2769, 2770, 2826, 2769, 2826, 2825, 2770, 2771, 2827, 2770, 2827, 2826, 2771, 2772, 2828, 2771, 2828, 2827, 2772, 2773, 2829, 2772, 2829, 2828, 2773, 2774, 2830, 2773, 2830, 2829, 2774, 2775, 2831, 2774, 2831, 2830, 2775, 2776, 2832, 2775, 2832, 2831, 2776, 2777, 2833, 2776, 2833, 2832, 2777, 2778, 2834, 2777, 2834, 2833, 2778, 2779, 2835, 2778, 2835, 2834, 2779, 2780, 2836, 2779, 2836, 2835, 2780, 2781, 2837, 2780, 2837, 2836, 2781, 2782, 2838, 2781, 2838, 2837, 2782, 2783, 2839, 2782, 2839, 2838, 2783, 2784, 2840, 2783, 2840, 2839, 2784, 2785, 2841, 2784, 2841, 2840, 2785, 2786, 2842, 2785, 2842, 2841, 2786, 2787, 2843, 2786, 2843, 2842, 2787, 2788, 2844, 2787, 2844, 2843, 2788, 2789, 2845, 2788, 2845, 2844, 2789, 2790, 2846, 2789, 2846, 2845, 2790, 2791, 2847, 2790, 2847, 2846, 2791, 2792, 2848, 2791, 2848, 2847, 2792, 2793, 2849, 2792, 2849, 2848, 2793, 2794, 2850, 2793, 2850, 2849, 2794, 2795, 2851, 2794, 2851, 2850, 2795, 2796, 2852, 2795, 2852, 2851, 2796, 2797, 2853, 2796, 2853, 2852, 2797, 2798, 2854, 2797, 2854, 2853, 2798, 2799, 2855, 2798, 2855, 2854, 2799, 2800, 2856, 2799, 2856, 2855, 2800, 2801, 2857, 2800, 2857, 2856, 2801, 2802, 2858, 2801, 2858, 2857, 2802, 2803, 2859, 2802, 2859, 2858, 2803, 2804, 2860, 2803, 2860, 2859, 2804, 2805, 2861, 2804, 2861, 2860, 2805, 2806, 2862, 2805, 2862, 2861, 2806, 2807, 2863, 2806, 2863, 2862, 2807, 2808, 2864, 2807, 2864, 2863, 2808, 2809, 2865, 2808, 2865, 2864, 2809, 109, 110, 2809, 110, 2865, 49, 2810, 2866, 49, 2866, 50, 2810, 2811, 2867, 2810, 2867, 2866, 2811, 2812, 2868, 2811, 2868, 2867, 2812, 2813, 2869, 2812, 2869, 2868, 2813, 2814, 2870, 2813, 2870, 2869, 2814, 2815, 2871, 2814, 2871, 2870, 2815, 2816, 2872, 2815, 2872, 2871, 2816, 2817, 2873, 2816, 2873, 2872, 2817, 2818, 2874, 2817, 2874, 2873, 2818, 2819, 2875, 2818, 2875, 2874, 2819, 2820, 2876, 2819, 2876, 2875, 2820, 2821, 2877, 2820, 2877, 2876, 2821, 2822, 2878, 2821, 2878, 2877, 2822, 2823, 2879, 2822, 2879, 2878, 2823, 2824, 2880, 2823, 2880, 2879, 2824, 2825, 2881, 2824, 2881, 2880, 2825, 2826, 2882, 2825, 2882, 2881, 2826, 2827, 2883, 2826, 2883, 2882, 2827, 2828, 2884, 2827, 2884, 2883, 2828, 2829, 2885, 2828, 2885, 2884, 2829, 2830, 2886, 2829, 2886, 2885, 2830, 2831, 2887, 2830, 2887, 2886, 2831, 2832, 2888, 2831, 2888, 2887, 2832, 2833, 2889, 2832, 2889, 2888, 2833, 2834, 2890, 2833, 2890, 2889, 2834, 2835, 2891, 2834, 2891, 2890, 2835, 2836, 2892, 2835, 2892, 2891, 2836, 2837, 2893, 2836, 2893, 2892, 2837, 2838, 2894, 2837, 2894, 2893, 2838, 2839, 2895, 2838, 2895, 2894, 2839, 2840, 2896, 2839, 2896, 2895, 2840, 2841, 2897, 2840, 2897, 2896, 2841, 2842, 2898, 2841, 2898, 2897, 2842, 2843, 2899, 2842, 2899, 2898, 2843, 2844, 2900, 2843, 2900, 2899, 2844, 2845, 2901, 2844, 2901, 2900, 2845, 2846, 2902, 2845, 2902, 2901, 2846, 2847, 2903, 2846, 2903, 2902, 2847, 2848, 2904, 2847, 2904, 2903, 2848, 2849, 2905, 2848, 2905, 2904, 2849, 2850, 2906, 2849, 2906, 2905, 2850, 2851, 2907, 2850, 2907, 2906, 2851, 2852, 2908, 2851, 2908, 2907, 2852, 2853, 2909, 2852, 2909, 2908, 2853, 2854, 2910, 2853, 2910, 2909, 2854, 2855, 2911, 2854, 2911, 2910, 2855, 2856, 2912, 2855, 2912, 2911, 2856, 2857, 2913, 2856, 2913, 2912, 2857, 2858, 2914, 2857, 2914, 2913, 2858, 2859, 2915, 2858, 2915, 2914, 2859, 2860, 2916, 2859, 2916, 2915, 2860, 2861, 2917, 2860, 2917, 2916, 2861, 2862, 2918, 2861, 2918, 2917, 2862, 2863, 2919, 2862, 2919, 2918, 2863, 2864, 2920, 2863, 2920, 2919, 2864, 2865, 2921, 2864, 2921, 2920, 2865, 110, 111, 2865, 111, 2921, 50, 2866, 2922, 50, 2922, 51, 2866, 2867, 2923, 2866, 2923, 2922, 2867, 2868, 2924, 2867, 2924, 2923, 2868, 2869, 2925, 2868, 2925, 2924, 2869, 2870, 2926, 2869, 2926, 2925, 2870, 2871, 2927, 2870, 2927, 2926, 2871, 2872, 2928, 2871, 2928, 2927, 2872, 2873, 2929, 2872, 2929, 2928, 2873, 2874, 2930, 2873, 2930, 2929, 2874, 2875, 2931, 2874, 2931, 2930, 2875, 2876, 2932, 2875, 2932, 2931, 2876, 2877, 2933, 2876, 2933, 2932, 2877, 2878, 2934, 2877, 2934, 2933, 2878, 2879, 2935, 2878, 2935, 2934, 2879, 2880, 2936, 2879, 2936, 2935, 2880, 2881, 2937, 2880, 2937, 2936, 2881, 2882, 2938, 2881, 2938, 2937, 2882, 2883, 2939, 2882, 2939, 2938, 2883, 2884, 2940, 2883, 2940, 2939, 2884, 2885, 2941, 2884, 2941, 2940, 2885, 2886, 2942, 2885, 2942, 2941, 2886, 2887, 2943, 2886, 2943, 2942, 2887, 2888, 2944, 2887, 2944, 2943, 2888, 2889, 2945, 2888, 2945, 2944, 2889, 2890, 2946, 2889, 2946, 2945, 2890, 2891, 2947, 2890, 2947, 2946, 2891, 2892, 2948, 2891, 2948, 2947, 2892, 2893, 2949, 2892, 2949, 2948, 2893, 2894, 2950, 2893, 2950, 2949, 2894, 2895, 2951, 2894, 2951, 2950, 2895, 2896, 2952, 2895, 2952, 2951, 2896, 2897, 2953, 2896, 2953, 2952, 2897, 2898, 2954, 2897, 2954, 2953, 2898, 2899, 2955, 2898, 2955, 2954, 2899, 2900, 2956, 2899, 2956, 2955, 2900, 2901, 2957, 2900, 2957, 2956, 2901, 2902, 2958, 2901, 2958, 2957, 2902, 2903, 2959, 2902, 2959, 2958, 2903, 2904, 2960, 2903, 2960, 2959, 2904, 2905, 2961, 2904, 2961, 2960, 2905, 2906, 2962, 2905, 2962, 2961, 2906, 2907, 2963, 2906, 2963, 2962, 2907, 2908, 2964, 2907, 2964, 2963, 2908, 2909, 2965, 2908, 2965, 2964, 2909, 2910, 2966, 2909, 2966, 2965, 2910, 2911, 2967, 2910, 2967, 2966, 2911, 2912, 2968, 2911, 2968, 2967, 2912, 2913, 2969, 2912, 2969, 2968, 2913, 2914, 2970, 2913, 2970, 2969, 2914, 2915, 2971, 2914, 2971, 2970, 2915, 2916, 2972, 2915, 2972, 2971, 2916, 2917, 2973, 2916, 2973, 2972, 2917, 2918, 2974, 2917, 2974, 2973, 2918, 2919, 2975, 2918, 2975, 2974, 2919, 2920, 2976, 2919, 2976, 2975, 2920, 2921, 2977, 2920, 2977, 2976, 2921, 111, 112, 2921, 112, 2977, 51, 2922, 2978, 51, 2978, 52, 2922, 2923, 2979, 2922, 2979, 2978, 2923, 2924, 2980, 2923, 2980, 2979, 2924, 2925, 2981, 2924, 2981, 2980, 2925, 2926, 2982, 2925, 2982, 2981, 2926, 2927, 2983, 2926, 2983, 2982, 2927, 2928, 2984, 2927, 2984, 2983, 2928, 2929, 2985, 2928, 2985, 2984, 2929, 2930, 2986, 2929, 2986, 2985, 2930, 2931, 2987, 2930, 2987, 2986, 2931, 2932, 2988, 2931, 2988, 2987, 2932, 2933, 2989, 2932, 2989, 2988, 2933, 2934, 2990, 2933, 2990, 2989, 2934, 2935, 2991, 2934, 2991, 2990, 2935, 2936, 2992, 2935, 2992, 2991, 2936, 2937, 2993, 2936, 2993, 2992, 2937, 2938, 2994, 2937, 2994, 2993, 2938, 2939, 2995, 2938, 2995, 2994, 2939, 2940, 2996, 2939, 2996, 2995, 2940, 2941, 2997, 2940, 2997, 2996, 2941, 2942, 2998, 2941, 2998, 2997, 2942, 2943, 2999, 2942, 2999, 2998, 2943, 2944, 3000, 2943, 3000, 2999, 2944, 2945, 3001, 2944, 3001, 3000, 2945, 2946, 3002, 2945, 3002, 3001, 2946, 2947, 3003, 2946, 3003, 3002, 2947, 2948, 3004, 2947, 3004, 3003, 2948, 2949, 3005, 2948, 3005, 3004, 2949, 2950, 3006, 2949, 3006, 3005, 2950, 2951, 3007, 2950, 3007, 3006, 2951, 2952, 3008, 2951, 3008, 3007, 2952, 2953, 3009, 2952, 3009, 3008, 2953, 2954, 3010, 2953, 3010, 3009, 2954, 2955, 3011, 2954, 3011, 3010, 2955, 2956, 3012, 2955, 3012, 3011, 2956, 2957, 3013, 2956, 3013, 3012, 2957, 2958, 3014, 2957, 3014, 3013, 2958, 2959, 3015, 2958, 3015, 3014, 2959, 2960, 3016, 2959, 3016, 3015, 2960, 2961, 3017, 2960, 3017, 3016, 2961, 2962, 3018, 2961, 3018, 3017, 2962, 2963, 3019, 2962, 3019, 3018, 2963, 2964, 3020, 2963, 3020, 3019, 2964, 2965, 3021, 2964, 3021, 3020, 2965, 2966, 3022, 2965, 3022, 3021, 2966, 2967, 3023, 2966, 3023, 3022, 2967, 2968, 3024, 2967, 3024, 3023, 2968, 2969, 3025, 2968, 3025, 3024, 2969, 2970, 3026, 2969, 3026, 3025, 2970, 2971, 3027, 2970, 3027, 3026, 2971, 2972, 3028, 2971, 3028, 3027, 2972, 2973, 3029, 2972, 3029, 3028, 2973, 2974, 3030, 2973, 3030, 3029, 2974, 2975, 3031, 2974, 3031, 3030, 2975, 2976, 3032, 2975, 3032, 3031, 2976, 2977, 3033, 2976, 3033, 3032, 2977, 112, 113, 2977, 113, 3033, 52, 2978, 3034, 52, 3034, 53, 2978, 2979, 3035, 2978, 3035, 3034, 2979, 2980, 3036, 2979, 3036, 3035, 2980, 2981, 3037, 2980, 3037, 3036, 2981, 2982, 3038, 2981, 3038, 3037, 2982, 2983, 3039, 2982, 3039, 3038, 2983, 2984, 3040, 2983, 3040, 3039, 2984, 2985, 3041, 2984, 3041, 3040, 2985, 2986, 3042, 2985, 3042, 3041, 2986, 2987, 3043, 2986, 3043, 3042, 2987, 2988, 3044, 2987, 3044, 3043, 2988, 2989, 3045, 2988, 3045, 3044, 2989, 2990, 3046, 2989, 3046, 3045, 2990, 2991, 3047, 2990, 3047, 3046, 2991, 2992, 3048, 2991, 3048, 3047, 2992, 2993, 3049, 2992, 3049, 3048, 2993, 2994, 3050, 2993, 3050, 3049, 2994, 2995, 3051, 2994, 3051, 3050, 2995, 2996, 3052, 2995, 3052, 3051, 2996, 2997, 3053, 2996, 3053, 3052, 2997, 2998, 3054, 2997, 3054, 3053, 2998, 2999, 3055, 2998, 3055, 3054, 2999, 3000, 3056, 2999, 3056, 3055, 3000, 3001, 3057, 3000, 3057, 3056, 3001, 3002, 3058, 3001, 3058, 3057, 3002, 3003, 3059, 3002, 3059, 3058, 3003, 3004, 3060, 3003, 3060, 3059, 3004, 3005, 3061, 3004, 3061, 3060, 3005, 3006, 3062, 3005, 3062, 3061, 3006, 3007, 3063, 3006, 3063, 3062, 3007, 3008, 3064, 3007, 3064, 3063, 3008, 3009, 3065, 3008, 3065, 3064, 3009, 3010, 3066, 3009, 3066, 3065, 3010, 3011, 3067, 3010, 3067, 3066, 3011, 3012, 3068, 3011, 3068, 3067, 3012, 3013, 3069, 3012, 3069, 3068, 3013, 3014, 3070, 3013, 3070, 3069, 3014, 3015, 3071, 3014, 3071, 3070, 3015, 3016, 3072, 3015, 3072, 3071, 3016, 3017, 3073, 3016, 3073, 3072, 3017, 3018, 3074, 3017, 3074, 3073, 3018, 3019, 3075, 3018, 3075, 3074, 3019, 3020, 3076, 3019, 3076, 3075, 3020, 3021, 3077, 3020, 3077, 3076, 3021, 3022, 3078, 3021, 3078, 3077, 3022, 3023, 3079, 3022, 3079, 3078, 3023, 3024, 3080, 3023, 3080, 3079, 3024, 3025, 3081, 3024, 3081, 3080, 3025, 3026, 3082, 3025, 3082, 3081, 3026, 3027, 3083, 3026, 3083, 3082, 3027, 3028, 3084, 3027, 3084, 3083, 3028, 3029, 3085, 3028, 3085, 3084, 3029, 3030, 3086, 3029, 3086, 3085, 3030, 3031, 3087, 3030, 3087, 3086, 3031, 3032, 3088, 3031, 3088, 3087, 3032, 3033, 3089, 3032, 3089, 3088, 3033, 113, 114, 3033, 114, 3089, 53, 3034, 3090, 53, 3090, 54, 3034, 3035, 3091, 3034, 3091, 3090, 3035, 3036, 3092, 3035, 3092, 3091, 3036, 3037, 3093, 3036, 3093, 3092, 3037, 3038, 3094, 3037, 3094, 3093, 3038, 3039, 3095, 3038, 3095, 3094, 3039, 3040, 3096, 3039, 3096, 3095, 3040, 3041, 3097, 3040, 3097, 3096, 3041, 3042, 3098, 3041, 3098, 3097, 3042, 3043, 3099, 3042, 3099, 3098, 3043, 3044, 3100, 3043, 3100, 3099, 3044, 3045, 3101, 3044, 3101, 3100, 3045, 3046, 3102, 3045, 3102, 3101, 3046, 3047, 3103, 3046, 3103, 3102, 3047, 3048, 3104, 3047, 3104, 3103, 3048, 3049, 3105, 3048, 3105, 3104, 3049, 3050, 3106, 3049, 3106, 3105, 3050, 3051, 3107, 3050, 3107, 3106, 3051, 3052, 3108, 3051, 3108, 3107, 3052, 3053, 3109, 3052, 3109, 3108, 3053, 3054, 3110, 3053, 3110, 3109, 3054, 3055, 3111, 3054, 3111, 3110, 3055, 3056, 3112, 3055, 3112, 3111, 3056, 3057, 3113, 3056, 3113, 3112, 3057, 3058, 3114, 3057, 3114, 3113, 3058, 3059, 3115, 3058, 3115, 3114, 3059, 3060, 3116, 3059, 3116, 3115, 3060, 3061, 3117, 3060, 3117, 3116, 3061, 3062, 3118, 3061, 3118, 3117, 3062, 3063, 3119, 3062, 3119, 3118, 3063, 3064, 3120, 3063, 3120, 3119, 3064, 3065, 3121, 3064, 3121, 3120, 3065, 3066, 3122, 3065, 3122, 3121, 3066, 3067, 3123, 3066, 3123, 3122, 3067, 3068, 3124, 3067, 3124, 3123, 3068, 3069, 3125, 3068, 3125, 3124, 3069, 3070, 3126, 3069, 3126, 3125, 3070, 3071, 3127, 3070, 3127, 3126, 3071, 3072, 3128, 3071, 3128, 3127, 3072, 3073, 3129, 3072, 3129, 3128, 3073, 3074, 3130, 3073, 3130, 3129, 3074, 3075, 3131, 3074, 3131, 3130, 3075, 3076, 3132, 3075, 3132, 3131, 3076, 3077, 3133, 3076, 3133, 3132, 3077, 3078, 3134, 3077, 3134, 3133, 3078, 3079, 3135, 3078, 3135, 3134, 3079, 3080, 3136, 3079, 3136, 3135, 3080, 3081, 3137, 3080, 3137, 3136, 3081, 3082, 3138, 3081, 3138, 3137, 3082, 3083, 3139, 3082, 3139, 3138, 3083, 3084, 3140, 3083, 3140, 3139, 3084, 3085, 3141, 3084, 3141, 3140, 3085, 3086, 3142, 3085, 3142, 3141, 3086, 3087, 3143, 3086, 3143, 3142, 3087, 3088, 3144, 3087, 3144, 3143, 3088, 3089, 3145, 3088, 3145, 3144, 3089, 114, 115, 3089, 115, 3145, 54, 3090, 3146, 54, 3146, 55, 3090, 3091, 3147, 3090, 3147, 3146, 3091, 3092, 3148, 3091, 3148, 3147, 3092, 3093, 3149, 3092, 3149, 3148, 3093, 3094, 3150, 3093, 3150, 3149, 3094, 3095, 3151, 3094, 3151, 3150, 3095, 3096, 3152, 3095, 3152, 3151, 3096, 3097, 3153, 3096, 3153, 3152, 3097, 3098, 3154, 3097, 3154, 3153, 3098, 3099, 3155, 3098, 3155, 3154, 3099, 3100, 3156, 3099, 3156, 3155, 3100, 3101, 3157, 3100, 3157, 3156, 3101, 3102, 3158, 3101, 3158, 3157, 3102, 3103, 3159, 3102, 3159, 3158, 3103, 3104, 3160, 3103, 3160, 3159, 3104, 3105, 3161, 3104, 3161, 3160, 3105, 3106, 3162, 3105, 3162, 3161, 3106, 3107, 3163, 3106, 3163, 3162, 3107, 3108, 3164, 3107, 3164, 3163, 3108, 3109, 3165, 3108, 3165, 3164, 3109, 3110, 3166, 3109, 3166, 3165, 3110, 3111, 3167, 3110, 3167, 3166, 3111, 3112, 3168, 3111, 3168, 3167, 3112, 3113, 3169, 3112, 3169, 3168, 3113, 3114, 3170, 3113, 3170, 3169, 3114, 3115, 3171, 3114, 3171, 3170, 3115, 3116, 3172, 3115, 3172, 3171, 3116, 3117, 3173, 3116, 3173, 3172, 3117, 3118, 3174, 3117, 3174, 3173, 3118, 3119, 3175, 3118, 3175, 3174, 3119, 3120, 3176, 3119, 3176, 3175, 3120, 3121, 3177, 3120, 3177, 3176, 3121, 3122, 3178, 3121, 3178, 3177, 3122, 3123, 3179, 3122, 3179, 3178, 3123, 3124, 3180, 3123, 3180, 3179, 3124, 3125, 3181, 3124, 3181, 3180, 3125, 3126, 3182, 3125, 3182, 3181, 3126, 3127, 3183, 3126, 3183, 3182, 3127, 3128, 3184, 3127, 3184, 3183, 3128, 3129, 3185, 3128, 3185, 3184, 3129, 3130, 3186, 3129, 3186, 3185, 3130, 3131, 3187, 3130, 3187, 3186, 3131, 3132, 3188, 3131, 3188, 3187, 3132, 3133, 3189, 3132, 3189, 3188, 3133, 3134, 3190, 3133, 3190, 3189, 3134, 3135, 3191, 3134, 3191, 3190, 3135, 3136, 3192, 3135, 3192, 3191, 3136, 3137, 3193, 3136, 3193, 3192, 3137, 3138, 3194, 3137, 3194, 3193, 3138, 3139, 3195, 3138, 3195, 3194, 3139, 3140, 3196, 3139, 3196, 3195, 3140, 3141, 3197, 3140, 3197, 3196, 3141, 3142, 3198, 3141, 3198, 3197, 3142, 3143, 3199, 3142, 3199, 3198, 3143, 3144, 3200, 3143, 3200, 3199, 3144, 3145, 3201, 3144, 3201, 3200, 3145, 115, 116, 3145, 116, 3201, 55, 3146, 3202, 55, 3202, 56, 3146, 3147, 3203, 3146, 3203, 3202, 3147, 3148, 3204, 3147, 3204, 3203, 3148, 3149, 3205, 3148, 3205, 3204, 3149, 3150, 3206, 3149, 3206, 3205, 3150, 3151, 3207, 3150, 3207, 3206, 3151, 3152, 3208, 3151, 3208, 3207, 3152, 3153, 3209, 3152, 3209, 3208, 3153, 3154, 3210, 3153, 3210, 3209, 3154, 3155, 3211, 3154, 3211, 3210, 3155, 3156, 3212, 3155, 3212, 3211, 3156, 3157, 3213, 3156, 3213, 3212, 3157, 3158, 3214, 3157, 3214, 3213, 3158, 3159, 3215, 3158, 3215, 3214, 3159, 3160, 3216, 3159, 3216, 3215, 3160, 3161, 3217, 3160, 3217, 3216, 3161, 3162, 3218, 3161, 3218, 3217, 3162, 3163, 3219, 3162, 3219, 3218, 3163, 3164, 3220, 3163, 3220, 3219, 3164, 3165, 3221, 3164, 3221, 3220, 3165, 3166, 3222, 3165, 3222, 3221, 3166, 3167, 3223, 3166, 3223, 3222, 3167, 3168, 3224, 3167, 3224, 3223, 3168, 3169, 3225, 3168, 3225, 3224, 3169, 3170, 3226, 3169, 3226, 3225, 3170, 3171, 3227, 3170, 3227, 3226, 3171, 3172, 3228, 3171, 3228, 3227, 3172, 3173, 3229, 3172, 3229, 3228, 3173, 3174, 3230, 3173, 3230, 3229, 3174, 3175, 3231, 3174, 3231, 3230, 3175, 3176, 3232, 3175, 3232, 3231, 3176, 3177, 3233, 3176, 3233, 3232, 3177, 3178, 3234, 3177, 3234, 3233, 3178, 3179, 3235, 3178, 3235, 3234, 3179, 3180, 3236, 3179, 3236, 3235, 3180, 3181, 3237, 3180, 3237, 3236, 3181, 3182, 3238, 3181, 3238, 3237, 3182, 3183, 3239, 3182, 3239, 3238, 3183, 3184, 3240, 3183, 3240, 3239, 3184, 3185, 3241, 3184, 3241, 3240, 3185, 3186, 3242, 3185, 3242, 3241, 3186, 3187, 3243, 3186, 3243, 3242, 3187, 3188, 3244, 3187, 3244, 3243, 3188, 3189, 3245, 3188, 3245, 3244, 3189, 3190, 3246, 3189, 3246, 3245, 3190, 3191, 3247, 3190, 3247, 3246, 3191, 3192, 3248, 3191, 3248, 3247, 3192, 3193, 3249, 3192, 3249, 3248, 3193, 3194, 3250, 3193, 3250, 3249, 3194, 3195, 3251, 3194, 3251, 3250, 3195, 3196, 3252, 3195, 3252, 3251, 3196, 3197, 3253, 3196, 3253, 3252, 3197, 3198, 3254, 3197, 3254, 3253, 3198, 3199, 3255, 3198, 3255, 3254, 3199, 3200, 3256, 3199, 3256, 3255, 3200, 3201, 3257, 3200, 3257, 3256, 3201, 116, 117, 3201, 117, 3257, 56, 3202, 3258, 56, 3258, 57, 3202, 3203, 3259, 3202, 3259, 3258, 3203, 3204, 3260, 3203, 3260, 3259, 3204, 3205, 3261, 3204, 3261, 3260, 3205, 3206, 3262, 3205, 3262, 3261, 3206, 3207, 3263, 3206, 3263, 3262, 3207, 3208, 3264, 3207, 3264, 3263, 3208, 3209, 3265, 3208, 3265, 3264, 3209, 3210, 3266, 3209, 3266, 3265, 3210, 3211, 3267, 3210, 3267, 3266, 3211, 3212, 3268, 3211, 3268, 3267, 3212, 3213, 3269, 3212, 3269, 3268, 3213, 3214, 3270, 3213, 3270, 3269, 3214, 3215, 3271, 3214, 3271, 3270, 3215, 3216, 3272, 3215, 3272, 3271, 3216, 3217, 3273, 3216, 3273, 3272, 3217, 3218, 3274, 3217, 3274, 3273, 3218, 3219, 3275, 3218, 3275, 3274, 3219, 3220, 3276, 3219, 3276, 3275, 3220, 3221, 3277, 3220, 3277, 3276, 3221, 3222, 3278, 3221, 3278, 3277, 3222, 3223, 3279, 3222, 3279, 3278, 3223, 3224, 3280, 3223, 3280, 3279, 3224, 3225, 3281, 3224, 3281, 3280, 3225, 3226, 3282, 3225, 3282, 3281, 3226, 3227, 3283, 3226, 3283, 3282, 3227, 3228, 3284, 3227, 3284, 3283, 3228, 3229, 3285, 3228, 3285, 3284, 3229, 3230, 3286, 3229, 3286, 3285, 3230, 3231, 3287, 3230, 3287, 3286, 3231, 3232, 3288, 3231, 3288, 3287, 3232, 3233, 3289, 3232, 3289, 3288, 3233, 3234, 3290, 3233, 3290, 3289, 3234, 3235, 3291, 3234, 3291, 3290, 3235, 3236, 3292, 3235, 3292, 3291, 3236, 3237, 3293, 3236, 3293, 3292, 3237, 3238, 3294, 3237, 3294, 3293, 3238, 3239, 3295, 3238, 3295, 3294, 3239, 3240, 3296, 3239, 3296, 3295, 3240, 3241, 3297, 3240, 3297, 3296, 3241, 3242, 3298, 3241, 3298, 3297, 3242, 3243, 3299, 3242, 3299, 3298, 3243, 3244, 3300, 3243, 3300, 3299, 3244, 3245, 3301, 3244, 3301, 3300, 3245, 3246, 3302, 3245, 3302, 3301, 3246, 3247, 3303, 3246, 3303, 3302, 3247, 3248, 3304, 3247, 3304, 3303, 3248, 3249, 3305, 3248, 3305, 3304, 3249, 3250, 3306, 3249, 3306, 3305, 3250, 3251, 3307, 3250, 3307, 3306, 3251, 3252, 3308, 3251, 3308, 3307, 3252, 3253, 3309, 3252, 3309, 3308, 3253, 3254, 3310, 3253, 3310, 3309, 3254, 3255, 3311, 3254, 3311, 3310, 3255, 3256, 3312, 3255, 3312, 3311, 3256, 3257, 3313, 3256, 3313, 3312, 3257, 117, 118, 3257, 118, 3313, 57, 3258, 3314, 57, 3314, 58, 3258, 3259, 3315, 3258, 3315, 3314, 3259, 3260, 3316, 3259, 3316, 3315, 3260, 3261, 3317, 3260, 3317, 3316, 3261, 3262, 3318, 3261, 3318, 3317, 3262, 3263, 3319, 3262, 3319, 3318, 3263, 3264, 3320, 3263, 3320, 3319, 3264, 3265, 3321, 3264, 3321, 3320, 3265, 3266, 3322, 3265, 3322, 3321, 3266, 3267, 3323, 3266, 3323, 3322, 3267, 3268, 3324, 3267, 3324, 3323, 3268, 3269, 3325, 3268, 3325, 3324, 3269, 3270, 3326, 3269, 3326, 3325, 3270, 3271, 3327, 3270, 3327, 3326, 3271, 3272, 3328, 3271, 3328, 3327, 3272, 3273, 3329, 3272, 3329, 3328, 3273, 3274, 3330, 3273, 3330, 3329, 3274, 3275, 3331, 3274, 3331, 3330, 3275, 3276, 3332, 3275, 3332, 3331, 3276, 3277, 3333, 3276, 3333, 3332, 3277, 3278, 3334, 3277, 3334, 3333, 3278, 3279, 3335, 3278, 3335, 3334, 3279, 3280, 3336, 3279, 3336, 3335, 3280, 3281, 3337, 3280, 3337, 3336, 3281, 3282, 3338, 3281, 3338, 3337, 3282, 3283, 3339, 3282, 3339, 3338, 3283, 3284, 3340, 3283, 3340, 3339, 3284, 3285, 3341, 3284, 3341, 3340, 3285, 3286, 3342, 3285, 3342, 3341, 3286, 3287, 3343, 3286, 3343, 3342, 3287, 3288, 3344, 3287, 3344, 3343, 3288, 3289, 3345, 3288, 3345, 3344, 3289, 3290, 3346, 3289, 3346, 3345, 3290, 3291, 3347, 3290, 3347, 3346, 3291, 3292, 3348, 3291, 3348, 3347, 3292, 3293, 3349, 3292, 3349, 3348, 3293, 3294, 3350, 3293, 3350, 3349, 3294, 3295, 3351, 3294, 3351, 3350, 3295, 3296, 3352, 3295, 3352, 3351, 3296, 3297, 3353, 3296, 3353, 3352, 3297, 3298, 3354, 3297, 3354, 3353, 3298, 3299, 3355, 3298, 3355, 3354, 3299, 3300, 3356, 3299, 3356, 3355, 3300, 3301, 3357, 3300, 3357, 3356, 3301, 3302, 3358, 3301, 3358, 3357, 3302, 3303, 3359, 3302, 3359, 3358, 3303, 3304, 3360, 3303, 3360, 3359, 3304, 3305, 3361, 3304, 3361, 3360, 3305, 3306, 3362, 3305, 3362, 3361, 3306, 3307, 3363, 3306, 3363, 3362, 3307, 3308, 3364, 3307, 3364, 3363, 3308, 3309, 3365, 3308, 3365, 3364, 3309, 3310, 3366, 3309, 3366, 3365, 3310, 3311, 3367, 3310, 3367, 3366, 3311, 3312, 3368, 3311, 3368, 3367, 3312, 3313, 3369, 3312, 3369, 3368, 3313, 118, 119, 3313, 119, 3369, 58, 3314, 3370, 58, 3370, 59, 3314, 3315, 3371, 3314, 3371, 3370, 3315, 3316, 3372, 3315, 3372, 3371, 3316, 3317, 3373, 3316, 3373, 3372, 3317, 3318, 3374, 3317, 3374, 3373, 3318, 3319, 3375, 3318, 3375, 3374, 3319, 3320, 3376, 3319, 3376, 3375, 3320, 3321, 3377, 3320, 3377, 3376, 3321, 3322, 3378, 3321, 3378, 3377, 3322, 3323, 3379, 3322, 3379, 3378, 3323, 3324, 3380, 3323, 3380, 3379, 3324, 3325, 3381, 3324, 3381, 3380, 3325, 3326, 3382, 3325, 3382, 3381, 3326, 3327, 3383, 3326, 3383, 3382, 3327, 3328, 3384, 3327, 3384, 3383, 3328, 3329, 3385, 3328, 3385, 3384, 3329, 3330, 3386, 3329, 3386, 3385, 3330, 3331, 3387, 3330, 3387, 3386, 3331, 3332, 3388, 3331, 3388, 3387, 3332, 3333, 3389, 3332, 3389, 3388, 3333, 3334, 3390, 3333, 3390, 3389, 3334, 3335, 3391, 3334, 3391, 3390, 3335, 3336, 3392, 3335, 3392, 3391, 3336, 3337, 3393, 3336, 3393, 3392, 3337, 3338, 3394, 3337, 3394, 3393, 3338, 3339, 3395, 3338, 3395, 3394, 3339, 3340, 3396, 3339, 3396, 3395, 3340, 3341, 3397, 3340, 3397, 3396, 3341, 3342, 3398, 3341, 3398, 3397, 3342, 3343, 3399, 3342, 3399, 3398, 3343, 3344, 3400, 3343, 3400, 3399, 3344, 3345, 3401, 3344, 3401, 3400, 3345, 3346, 3402, 3345, 3402, 3401, 3346, 3347, 3403, 3346, 3403, 3402, 3347, 3348, 3404, 3347, 3404, 3403, 3348, 3349, 3405, 3348, 3405, 3404, 3349, 3350, 3406, 3349, 3406, 3405, 3350, 3351, 3407, 3350, 3407, 3406, 3351, 3352, 3408, 3351, 3408, 3407, 3352, 3353, 3409, 3352, 3409, 3408, 3353, 3354, 3410, 3353, 3410, 3409, 3354, 3355, 3411, 3354, 3411, 3410, 3355, 3356, 3412, 3355, 3412, 3411, 3356, 3357, 3413, 3356, 3413, 3412, 3357, 3358, 3414, 3357, 3414, 3413, 3358, 3359, 3415, 3358, 3415, 3414, 3359, 3360, 3416, 3359, 3416, 3415, 3360, 3361, 3417, 3360, 3417, 3416, 3361, 3362, 3418, 3361, 3418, 3417, 3362, 3363, 3419, 3362, 3419, 3418, 3363, 3364, 3420, 3363, 3420, 3419, 3364, 3365, 3421, 3364, 3421, 3420, 3365, 3366, 3422, 3365, 3422, 3421, 3366, 3367, 3423, 3366, 3423, 3422, 3367, 3368, 3424, 3367, 3424, 3423, 3368, 3369, 3425, 3368, 3425, 3424, 3369, 119, 120, 3369, 120, 3425, 59, 3370, 3426, 59, 3426, 60, 3370, 3371, 3427, 3370, 3427, 3426, 3371, 3372, 3428, 3371, 3428, 3427, 3372, 3373, 3429, 3372, 3429, 3428, 3373, 3374, 3430, 3373, 3430, 3429, 3374, 3375, 3431, 3374, 3431, 3430, 3375, 3376, 3432, 3375, 3432, 3431, 3376, 3377, 3433, 3376, 3433, 3432, 3377, 3378, 3434, 3377, 3434, 3433, 3378, 3379, 3435, 3378, 3435, 3434, 3379, 3380, 3436, 3379, 3436, 3435, 3380, 3381, 3437, 3380, 3437, 3436, 3381, 3382, 3438, 3381, 3438, 3437, 3382, 3383, 3439, 3382, 3439, 3438, 3383, 3384, 3440, 3383, 3440, 3439, 3384, 3385, 3441, 3384, 3441, 3440, 3385, 3386, 3442, 3385, 3442, 3441, 3386, 3387, 3443, 3386, 3443, 3442, 3387, 3388, 3444, 3387, 3444, 3443, 3388, 3389, 3445, 3388, 3445, 3444, 3389, 3390, 3446, 3389, 3446, 3445, 3390, 3391, 3447, 3390, 3447, 3446, 3391, 3392, 3448, 3391, 3448, 3447, 3392, 3393, 3449, 3392, 3449, 3448, 3393, 3394, 3450, 3393, 3450, 3449, 3394, 3395, 3451, 3394, 3451, 3450, 3395, 3396, 3452, 3395, 3452, 3451, 3396, 3397, 3453, 3396, 3453, 3452, 3397, 3398, 3454, 3397, 3454, 3453, 3398, 3399, 3455, 3398, 3455, 3454, 3399, 3400, 3456, 3399, 3456, 3455, 3400, 3401, 3457, 3400, 3457, 3456, 3401, 3402, 3458, 3401, 3458, 3457, 3402, 3403, 3459, 3402, 3459, 3458, 3403, 3404, 3460, 3403, 3460, 3459, 3404, 3405, 3461, 3404, 3461, 3460, 3405, 3406, 3462, 3405, 3462, 3461, 3406, 3407, 3463, 3406, 3463, 3462, 3407, 3408, 3464, 3407, 3464, 3463, 3408, 3409, 3465, 3408, 3465, 3464, 3409, 3410, 3466, 3409, 3466, 3465, 3410, 3411, 3467, 3410, 3467, 3466, 3411, 3412, 3468, 3411, 3468, 3467, 3412, 3413, 3469, 3412, 3469, 3468, 3413, 3414, 3470, 3413, 3470, 3469, 3414, 3415, 3471, 3414, 3471, 3470, 3415, 3416, 3472, 3415, 3472, 3471, 3416, 3417, 3473, 3416, 3473, 3472, 3417, 3418, 3474, 3417, 3474, 3473, 3418, 3419, 3475, 3418, 3475, 3474, 3419, 3420, 3476, 3419, 3476, 3475, 3420, 3421, 3477, 3420, 3477, 3476, 3421, 3422, 3478, 3421, 3478, 3477, 3422, 3423, 3479, 3422, 3479, 3478, 3423, 3424, 3480, 3423, 3480, 3479, 3424, 3425, 3481, 3424, 3481, 3480, 3425, 120, 121, 3425, 121, 3481, 60, 3426, 122, 60, 122, 0, 3426, 3427, 124, 3426, 124, 122, 3427, 3428, 126, 3427, 126, 124, 3428, 3429, 128, 3428, 128, 126, 3429, 3430, 130, 3429, 130, 128, 3430, 3431, 132, 3430, 132, 130, 3431, 3432, 134, 3431, 134, 132, 3432, 3433, 136, 3432, 136, 134, 3433, 3434, 138, 3433, 138, 136, 3434, 3435, 140, 3434, 140, 138, 3435, 3436, 142, 3435, 142, 140, 3436, 3437, 144, 3436, 144, 142, 3437, 3438, 146, 3437, 146, 144, 3438, 3439, 148, 3438, 148, 146, 3439, 3440, 150, 3439, 150, 148, 3440, 3441, 152, 3440, 152, 150, 3441, 3442, 154, 3441, 154, 152, 3442, 3443, 156, 3442, 156, 154, 3443, 3444, 158, 3443, 158, 156, 3444, 3445, 160, 3444, 160, 158, 3445, 3446, 162, 3445, 162, 160, 3446, 3447, 164, 3446, 164, 162, 3447, 3448, 166, 3447, 166, 164, 3448, 3449, 168, 3448, 168, 166, 3449, 3450, 170, 3449, 170, 168, 3450, 3451, 172, 3450, 172, 170, 3451, 3452, 174, 3451, 174, 172, 3452, 3453, 176, 3452, 176, 174, 3453, 3454, 178, 3453, 178, 176, 3454, 3455, 180, 3454, 180, 178, 3455, 3456, 182, 3455, 182, 180, 3456, 3457, 184, 3456, 184, 182, 3457, 3458, 186, 3457, 186, 184, 3458, 3459, 188, 3458, 188, 186, 3459, 3460, 190, 3459, 190, 188, 3460, 3461, 192, 3460, 192, 190, 3461, 3462, 194, 3461, 194, 192, 3462, 3463, 196, 3462, 196, 194, 3463, 3464, 198, 3463, 198, 196, 3464, 3465, 200, 3464, 200, 198, 3465, 3466, 202, 3465, 202, 200, 3466, 3467, 204, 3466, 204, 202, 3467, 3468, 206, 3467, 206, 204, 3468, 3469, 208, 3468, 208, 206, 3469, 3470, 210, 3469, 210, 208, 3470, 3471, 212, 3470, 212, 210, 3471, 3472, 214, 3471, 214, 212, 3472, 3473, 216, 3472, 216, 214, 3473, 3474, 218, 3473, 218, 216, 3474, 3475, 220, 3474, 220, 218, 3475, 3476, 222, 3475, 222, 220, 3476, 3477, 224, 3476, 224, 222, 3477, 3478, 226, 3477, 226, 224, 3478, 3479, 228, 3478, 228, 226, 3479, 3480, 230, 3479, 230, 228, 3480, 3481, 232, 3480, 232, 230, 3481, 121, 61, 3481, 61, 232],
    "diffuse": [0.71875, 0.0, 0.1796, 1.0]
};

var ballMesh = {
    "vertices": [0.101168, 1.0, 0.994869, 0.0992244, 1.01974, 0.994869, 0.0, 1.0, 1.0, 0.0934673, 1.03872, 0.994869, 0.0841184, 1.05621, 0.994869, 0.0715368, 1.07154, 0.994869, 0.0562061, 1.08412, 0.994869, 0.0387154, 1.09347, 0.994869, 0.019737, 1.09922, 0.994869, -4.42221e-09, 1.10117, 0.994869, -0.019737, 1.09922, 0.994869, -0.0387154, 1.09347, 0.994869, -0.0562061, 1.08412, 0.994869, -0.0715368, 1.07154, 0.994869, -0.0841184, 1.05621, 0.994869, -0.0934673, 1.03872, 0.994869, -0.0992244, 1.01974, 0.994869, -0.101168, 1.0, 0.994869, -0.0992244, 0.980263, 0.994869, -0.0934673, 0.961285, 0.994869, -0.0841184, 0.943794, 0.994869, -0.0715368, 0.928463, 0.994869, -0.0562061, 0.915882, 0.994869, -0.0387154, 0.906533, 0.994869, -0.0197369, 0.900776, 0.994869, 1.32666e-08, 0.898832, 0.994869, 0.019737, 0.900776, 0.994869, 0.0387155, 0.906533, 0.994869, 0.0562061, 0.915882, 0.994869, 0.0715368, 0.928463, 0.994869, 0.0841184, 0.943794, 0.994869, 0.0934673, 0.961285, 0.994869, 0.0992244, 0.980263, 0.994869, 0.101168, 1.0, -0.994869, 0.0, 1.0, -1.0, 0.0992243, 1.01974, -0.994869, 0.0934673, 1.03872, -0.994869, 0.0841183, 1.05621, -0.994869, 0.0715367, 1.07154, -0.994869, 0.0562061, 1.08412, -0.994869, 0.0387154, 1.09347, -0.994869, 0.0197369, 1.09922, -0.994869, -4.4222e-09, 1.10117, -0.994869, -0.0197369, 1.09922, -0.994869, -0.0387154, 1.09347, -0.994869, -0.0562061, 1.08412, -0.994869, -0.0715367, 1.07154, -0.994869, -0.0841183, 1.05621, -0.994869, -0.0934673, 1.03872, -0.994869, -0.0992243, 1.01974, -0.994869, -0.101168, 1.0, -0.994869, -0.0992243, 0.980263, -0.994869, -0.0934673, 0.961285, -0.994869, -0.0841183, 0.943794, -0.994869, -0.0715367, 0.928463, -0.994869, -0.0562061, 0.915882, -0.994869, -0.0387154, 0.906533, -0.994869, -0.0197369, 0.900776, -0.994869, 1.32666e-08, 0.898832, -0.994869, 0.019737, 0.900776, -0.994869, 0.0387154, 0.906533, -0.994869, 0.0562061, 0.915882, -0.994869, 0.0715368, 0.928463, -0.994869, 0.0841183, 0.943794, -0.994869, 0.0934673, 0.961285, -0.994869, 0.0992243, 0.980263, -0.994869, 0.201299, 1.0, 0.97953, 0.197431, 1.03927, 0.97953, 0.299363, 1.0, 0.954139, 0.293611, 1.0584, 0.954139, 0.394356, 1.0, 0.918958, 0.386778, 1.07694, 0.918958, 0.485302, 1.0, 0.874347, 0.475977, 1.09468, 0.874347, 0.571268, 1.0, 0.820763, 0.560291, 1.11145, 0.820763, 0.651372, 1.0, 0.758758, 0.638857, 1.12708, 0.758758, 0.724793, 1.0, 0.688967, 0.710866, 1.1414, 0.688967, 0.790776, 1.0, 0.612106, 0.775581, 1.15427, 0.612106, 0.848644, 1.0, 0.528964, 0.832338, 1.16556, 0.528964, 0.897805, 1.0, 0.440394, 0.880553, 1.17515, 0.440394, 0.937752, 1.0, 0.347305, 0.919734, 1.18295, 0.347305, 0.968077, 1.0, 0.250652, 0.949476, 1.18886, 0.250652, 0.988468, 1.0, 0.151428, 0.969475, 1.19284, 0.151428, 0.998717, 1.0, 0.0506491, 0.979526, 1.19484, 0.0506491, 0.998717, 1.0, -0.0506492, 0.979526, 1.19484, -0.0506492, 0.988468, 1.0, -0.151428, 0.969475, 1.19284, -0.151428, 0.968077, 1.0, -0.250653, 0.949476, 1.18886, -0.250653, 0.937752, 1.0, -0.347305, 0.919733, 1.18295, -0.347305, 0.897804, 1.0, -0.440394, 0.880553, 1.17515, -0.440394, 0.848644, 1.0, -0.528964, 0.832338, 1.16556, -0.528964, 0.790776, 1.0, -0.612106, 0.775581, 1.15427, -0.612106, 0.724793, 1.0, -0.688967, 0.710866, 1.1414, -0.688967, 0.651372, 1.0, -0.758758, 0.638856, 1.12708, -0.758758, 0.571268, 1.0, -0.820763, 0.560291, 1.11145, -0.820763, 0.485302, 1.0, -0.874347, 0.475977, 1.09468, -0.874347, 0.394356, 1.0, -0.918958, 0.386778, 1.07694, -0.918958, 0.299363, 1.0, -0.954139, 0.293611, 1.0584, -0.954139, 0.201298, 1.0, -0.97953, 0.197431, 1.03927, -0.97953, 0.185976, 1.07703, 0.97953, 0.276575, 1.11456, 0.954139, 0.364337, 1.15091, 0.918958, 0.448361, 1.18572, 0.874347, 0.527783, 1.21861, 0.820763, 0.60179, 1.24927, 0.758758, 0.669621, 1.27737, 0.688967, 0.730582, 1.30262, 0.612106, 0.784045, 1.32476, 0.528964, 0.829463, 1.34357, 0.440394, 0.86637, 1.35886, 0.347305, 0.894387, 1.37047, 0.250652, 0.913226, 1.37827, 0.151428, 0.922694, 1.38219, 0.0506491, 0.922694, 1.38219, -0.0506492, 0.913226, 1.37827, -0.151428, 0.894387, 1.37047, -0.250653, 0.86637, 1.35886, -0.347305, 0.829463, 1.34357, -0.440394, 0.784045, 1.32476, -0.528964, 0.730581, 1.30262, -0.612106, 0.669621, 1.27737, -0.688967, 0.60179, 1.24927, -0.758758, 0.527783, 1.21861, -0.820763, 0.448361, 1.18572, -0.874347, 0.364337, 1.15091, -0.918958, 0.276575, 1.11456, -0.954139, 0.185976, 1.07703, -0.97953, 0.167374, 1.11184, 0.97953, 0.248911, 1.16632, 0.954139, 0.327895, 1.21909, 0.918958, 0.403514, 1.26962, 0.874347, 0.474992, 1.31738, 0.820763, 0.541596, 1.36188, 0.758758, 0.602643, 1.40267, 0.688967, 0.657506, 1.43933, 0.612106, 0.705622, 1.47148, 0.528964, 0.746497, 1.49879, 0.440394, 0.779712, 1.52099, 0.347305, 0.804927, 1.53783, 0.250652, 0.821881, 1.54916, 0.151428, 0.830402, 1.55486, 0.0506491, 0.830402, 1.55486, -0.0506492, 0.821881, 1.54916, -0.151428, 0.804927, 1.53783, -0.250653, 0.779712, 1.52099, -0.347305, 0.746497, 1.49879, -0.440394, 0.705622, 1.47148, -0.528964, 0.657506, 1.43933, -0.612106, 0.602643, 1.40267, -0.688967, 0.541596, 1.36188, -0.758758, 0.474992, 1.31738, -0.820763, 0.403514, 1.26962, -0.874347, 0.327895, 1.21909, -0.918958, 0.248911, 1.16632, -0.954139, 0.167374, 1.11184, -0.97953, 0.14234, 1.14234, 0.97953, 0.211682, 1.21168, 0.954139, 0.278852, 1.27885, 0.918958, 0.34316, 1.34316, 0.874347, 0.403948, 1.40395, 0.820763, 0.46059, 1.46059, 0.758758, 0.512506, 1.51251, 0.688967, 0.559163, 1.55916, 0.612106, 0.600082, 1.60008, 0.528964, 0.634844, 1.63484, 0.440394, 0.663091, 1.66309, 0.347305, 0.684534, 1.68453, 0.250652, 0.698953, 1.69895, 0.151428, 0.706199, 1.7062, 0.0506491, 0.706199, 1.7062, -0.0506492, 0.698953, 1.69895, -0.151428, 0.684534, 1.68453, -0.250653, 0.663091, 1.66309, -0.347305, 0.634844, 1.63484, -0.440394, 0.600082, 1.60008, -0.528964, 0.559163, 1.55916, -0.612106, 0.512506, 1.51251, -0.688967, 0.46059, 1.46059, -0.758758, 0.403948, 1.40395, -0.820763, 0.34316, 1.34316, -0.874347, 0.278852, 1.27885, -0.918958, 0.211682, 1.21168, -0.954139, 0.142339, 1.14234, -0.97953, 0.111835, 1.16737, 0.97953, 0.166317, 1.24891, 0.954139, 0.219092, 1.32789, 0.918958, 0.269619, 1.40351, 0.874347, 0.31738, 1.47499, 0.820763, 0.361883, 1.5416, 0.758758, 0.402673, 1.60264, 0.688967, 0.439331, 1.65751, 0.612106, 0.471481, 1.70562, 0.528964, 0.498793, 1.7465, 0.440394, 0.520987, 1.77971, 0.347305, 0.537835, 1.80493, 0.250652, 0.549164, 1.82188, 0.151428, 0.554857, 1.8304, 0.0506491, 0.554857, 1.8304, -0.0506492, 0.549164, 1.82188, -0.151428, 0.537835, 1.80493, -0.250653, 0.520987, 1.77971, -0.347305, 0.498793, 1.7465, -0.440394, 0.471481, 1.70562, -0.528964, 0.439331, 1.65751, -0.612106, 0.402673, 1.60264, -0.688967, 0.361883, 1.5416, -0.758758, 0.31738, 1.47499, -0.820763, 0.269619, 1.40351, -0.874347, 0.219092, 1.32789, -0.918958, 0.166317, 1.24891, -0.954139, 0.111835, 1.16737, -0.97953, 0.0770336, 1.18598, 0.97953, 0.114561, 1.27658, 0.954139, 0.150913, 1.36434, 0.918958, 0.185717, 1.44836, 0.874347, 0.218615, 1.52778, 0.820763, 0.249269, 1.60179, 0.758758, 0.277366, 1.66962, 0.688967, 0.302617, 1.73058, 0.612106, 0.324762, 1.78405, 0.528964, 0.343575, 1.82946, 0.440394, 0.358862, 1.86637, 0.347305, 0.370467, 1.89439, 0.250652, 0.37827, 1.91323, 0.151428, 0.382192, 1.92269, 0.0506491, 0.382192, 1.92269, -0.0506492, 0.37827, 1.91323, -0.151428, 0.370467, 1.89439, -0.250653, 0.358862, 1.86637, -0.347305, 0.343575, 1.82946, -0.440394, 0.324762, 1.78405, -0.528964, 0.302617, 1.73058, -0.612106, 0.277366, 1.66962, -0.688967, 0.249269, 1.60179, -0.758758, 0.218615, 1.52778, -0.820763, 0.185717, 1.44836, -0.874347, 0.150913, 1.36434, -0.918958, 0.114561, 1.27658, -0.954139, 0.0770336, 1.18598, -0.97953, 0.0392714, 1.19743, 0.97953, 0.0584028, 1.29361, 0.954139, 0.076935, 1.38678, 0.918958, 0.0946777, 1.47598, 0.874347, 0.111449, 1.56029, 0.820763, 0.127076, 1.63886, 0.758758, 0.1414, 1.71087, 0.688967, 0.154273, 1.77558, 0.612106, 0.165562, 1.83234, 0.528964, 0.175153, 1.88055, 0.440394, 0.182946, 1.91973, 0.347305, 0.188862, 1.94948, 0.250652, 0.192841, 1.96948, 0.151428, 0.19484, 1.97953, 0.0506491, 0.19484, 1.97953, -0.0506492, 0.192841, 1.96948, -0.151428, 0.188862, 1.94948, -0.250653, 0.182946, 1.91973, -0.347305, 0.175153, 1.88055, -0.440394, 0.165562, 1.83234, -0.528964, 0.154273, 1.77558, -0.612106, 0.1414, 1.71087, -0.688967, 0.127076, 1.63886, -0.758758, 0.111449, 1.56029, -0.820763, 0.0946777, 1.47598, -0.874347, 0.076935, 1.38678, -0.918958, 0.0584028, 1.29361, -0.954139, 0.0392714, 1.19743, -0.97953, -8.79904e-09, 1.2013, 0.97953, -1.30856e-08, 1.29936, 0.954139, -1.72378e-08, 1.39436, 0.918958, -2.12132e-08, 1.4853, 0.874347, -2.49709e-08, 1.57127, 0.820763, -2.84724e-08, 1.65137, 0.758758, -3.16817e-08, 1.72479, 0.688967, -3.45659e-08, 1.79078, 0.612106, -3.70954e-08, 1.84864, 0.528964, -3.92443e-08, 1.8978, 0.440394, -4.09905e-08, 1.93775, 0.347305, -4.2316e-08, 1.96808, 0.250652, -4.32073e-08, 1.98847, 0.151428, -4.36553e-08, 1.99872, 0.0506491, -4.36553e-08, 1.99872, -0.0506492, -4.32073e-08, 1.98847, -0.151428, -4.2316e-08, 1.96808, -0.250653, -4.09904e-08, 1.93775, -0.347305, -3.92443e-08, 1.8978, -0.440394, -3.70954e-08, 1.84864, -0.528964, -3.45659e-08, 1.79078, -0.612106, -3.16817e-08, 1.72479, -0.688967, -2.84724e-08, 1.65137, -0.758758, -2.49709e-08, 1.57127, -0.820763, -2.12132e-08, 1.4853, -0.874347, -1.72378e-08, 1.39436, -0.918958, -1.30856e-08, 1.29936, -0.954139, -8.79903e-09, 1.2013, -0.97953, -0.0392714, 1.19743, 0.97953, -0.0584029, 1.29361, 0.954139, -0.076935, 1.38678, 0.918958, -0.0946777, 1.47598, 0.874347, -0.111449, 1.56029, 0.820763, -0.127077, 1.63886, 0.758758, -0.1414, 1.71087, 0.688967, -0.154273, 1.77558, 0.612106, -0.165562, 1.83234, 0.528964, -0.175153, 1.88055, 0.440394, -0.182946, 1.91973, 0.347305, -0.188863, 1.94948, 0.250652, -0.192841, 1.96948, 0.151428, -0.19484, 1.97953, 0.0506491, -0.19484, 1.97953, -0.0506492, -0.192841, 1.96948, -0.151428, -0.188863, 1.94948, -0.250653, -0.182946, 1.91973, -0.347305, -0.175153, 1.88055, -0.440394, -0.165562, 1.83234, -0.528964, -0.154273, 1.77558, -0.612106, -0.1414, 1.71087, -0.688967, -0.127076, 1.63886, -0.758758, -0.111449, 1.56029, -0.820763, -0.0946777, 1.47598, -0.874347, -0.076935, 1.38678, -0.918958, -0.0584028, 1.29361, -0.954139, -0.0392714, 1.19743, -0.97953, -0.0770336, 1.18598, 0.97953, -0.114561, 1.27658, 0.954139, -0.150913, 1.36434, 0.918958, -0.185717, 1.44836, 0.874347, -0.218615, 1.52778, 0.820763, -0.24927, 1.60179, 0.758758, -0.277366, 1.66962, 0.688967, -0.302617, 1.73058, 0.612106, -0.324762, 1.78405, 0.528964, -0.343575, 1.82946, 0.440394, -0.358862, 1.86637, 0.347305, -0.370467, 1.89439, 0.250652, -0.378271, 1.91323, 0.151428, -0.382192, 1.92269, 0.0506491, -0.382192, 1.92269, -0.0506492, -0.378271, 1.91323, -0.151428, -0.370467, 1.89439, -0.250653, -0.358862, 1.86637, -0.347305, -0.343575, 1.82946, -0.440394, -0.324762, 1.78404, -0.528964, -0.302617, 1.73058, -0.612106, -0.277366, 1.66962, -0.688967, -0.249269, 1.60179, -0.758758, -0.218615, 1.52778, -0.820763, -0.185717, 1.44836, -0.874347, -0.150913, 1.36434, -0.918958, -0.114561, 1.27658, -0.954139, -0.0770336, 1.18598, -0.97953, -0.111835, 1.16737, 0.97953, -0.166317, 1.24891, 0.954139, -0.219092, 1.32789, 0.918958, -0.269619, 1.40351, 0.874347, -0.31738, 1.47499, 0.820763, -0.361883, 1.5416, 0.758758, -0.402673, 1.60264, 0.688967, -0.439332, 1.65751, 0.612106, -0.471482, 1.70562, 0.528964, -0.498794, 1.7465, 0.440394, -0.520987, 1.77971, 0.347305, -0.537835, 1.80493, 0.250652, -0.549164, 1.82188, 0.151428, -0.554857, 1.8304, 0.0506491, -0.554857, 1.8304, -0.0506492, -0.549164, 1.82188, -0.151428, -0.537835, 1.80493, -0.250653, -0.520987, 1.77971, -0.347305, -0.498794, 1.7465, -0.440394, -0.471482, 1.70562, -0.528964, -0.439331, 1.65751, -0.612106, -0.402673, 1.60264, -0.688967, -0.361883, 1.5416, -0.758758, -0.31738, 1.47499, -0.820763, -0.269619, 1.40351, -0.874347, -0.219092, 1.32789, -0.918958, -0.166317, 1.24891, -0.954139, -0.111835, 1.16737, -0.97953, -0.14234, 1.14234, 0.97953, -0.211682, 1.21168, 0.954139, -0.278852, 1.27885, 0.918958, -0.34316, 1.34316, 0.874347, -0.403948, 1.40395, 0.820763, -0.46059, 1.46059, 0.758758, -0.512506, 1.51251, 0.688967, -0.559163, 1.55916, 0.612106, -0.600082, 1.60008, 0.528964, -0.634844, 1.63484, 0.440394, -0.663091, 1.66309, 0.347305, -0.684534, 1.68453, 0.250652, -0.698953, 1.69895, 0.151428, -0.706199, 1.7062, 0.0506491, -0.706199, 1.7062, -0.0506492, -0.698953, 1.69895, -0.151428, -0.684534, 1.68453, -0.250653, -0.663091, 1.66309, -0.347305, -0.634844, 1.63484, -0.440394, -0.600082, 1.60008, -0.528964, -0.559163, 1.55916, -0.612106, -0.512506, 1.51251, -0.688967, -0.46059, 1.46059, -0.758758, -0.403948, 1.40395, -0.820763, -0.34316, 1.34316, -0.874347, -0.278852, 1.27885, -0.918958, -0.211682, 1.21168, -0.954139, -0.142339, 1.14234, -0.97953, -0.167374, 1.11184, 0.97953, -0.248911, 1.16632, 0.954139, -0.327895, 1.21909, 0.918958, -0.403514, 1.26962, 0.874347, -0.474992, 1.31738, 0.820763, -0.541596, 1.36188, 0.758758, -0.602643, 1.40267, 0.688967, -0.657506, 1.43933, 0.612106, -0.705622, 1.47148, 0.528964, -0.746497, 1.49879, 0.440394, -0.779712, 1.52099, 0.347305, -0.804927, 1.53783, 0.250652, -0.821881, 1.54916, 0.151428, -0.830402, 1.55486, 0.0506491, -0.830402, 1.55486, -0.0506492, -0.821881, 1.54916, -0.151428, -0.804927, 1.53783, -0.250653, -0.779712, 1.52099, -0.347305, -0.746497, 1.49879, -0.440394, -0.705622, 1.47148, -0.528964, -0.657506, 1.43933, -0.612106, -0.602643, 1.40267, -0.688967, -0.541596, 1.36188, -0.758758, -0.474992, 1.31738, -0.820763, -0.403514, 1.26962, -0.874347, -0.327895, 1.21909, -0.918958, -0.248911, 1.16632, -0.954139, -0.167374, 1.11184, -0.97953, -0.185976, 1.07703, 0.97953, -0.276575, 1.11456, 0.954139, -0.364337, 1.15091, 0.918958, -0.448361, 1.18572, 0.874347, -0.527783, 1.21861, 0.820763, -0.60179, 1.24927, 0.758758, -0.669621, 1.27737, 0.688967, -0.730582, 1.30262, 0.612106, -0.784045, 1.32476, 0.528964, -0.829463, 1.34357, 0.440394, -0.86637, 1.35886, 0.347305, -0.894387, 1.37047, 0.250652, -0.913226, 1.37827, 0.151428, -0.922694, 1.38219, 0.0506491, -0.922694, 1.38219, -0.0506492, -0.913226, 1.37827, -0.151428, -0.894387, 1.37047, -0.250653, -0.86637, 1.35886, -0.347305, -0.829463, 1.34357, -0.440394, -0.784045, 1.32476, -0.528964, -0.730582, 1.30262, -0.612106, -0.669621, 1.27737, -0.688967, -0.60179, 1.24927, -0.758758, -0.527783, 1.21861, -0.820763, -0.448361, 1.18572, -0.874347, -0.364337, 1.15091, -0.918958, -0.276575, 1.11456, -0.954139, -0.185976, 1.07703, -0.97953, -0.197431, 1.03927, 0.97953, -0.293611, 1.0584, 0.954139, -0.386778, 1.07693, 0.918958, -0.475977, 1.09468, 0.874347, -0.560291, 1.11145, 0.820763, -0.638857, 1.12708, 0.758758, -0.710866, 1.1414, 0.688967, -0.775581, 1.15427, 0.612106, -0.832338, 1.16556, 0.528964, -0.880553, 1.17515, 0.440394, -0.919734, 1.18295, 0.347305, -0.949476, 1.18886, 0.250652, -0.969475, 1.19284, 0.151428, -0.979526, 1.19484, 0.0506491, -0.979526, 1.19484, -0.0506492, -0.969475, 1.19284, -0.151428, -0.949476, 1.18886, -0.250653, -0.919733, 1.18295, -0.347305, -0.880553, 1.17515, -0.440394, -0.832338, 1.16556, -0.528964, -0.775581, 1.15427, -0.612106, -0.710866, 1.1414, -0.688967, -0.638857, 1.12708, -0.758758, -0.560291, 1.11145, -0.820763, -0.475977, 1.09468, -0.874347, -0.386778, 1.07693, -0.918958, -0.293611, 1.0584, -0.954139, -0.197431, 1.03927, -0.97953, -0.201299, 1.0, 0.97953, -0.299363, 1.0, 0.954139, -0.394356, 1.0, 0.918958, -0.485302, 1.0, 0.874347, -0.571268, 1.0, 0.820763, -0.651372, 1.0, 0.758758, -0.724793, 1.0, 0.688967, -0.790776, 1.0, 0.612106, -0.848644, 1.0, 0.528964, -0.897805, 1.0, 0.440394, -0.937752, 1.0, 0.347305, -0.968077, 1.0, 0.250652, -0.988468, 1.0, 0.151428, -0.998717, 1.0, 0.0506491, -0.998717, 1.0, -0.0506492, -0.988468, 1.0, -0.151428, -0.968077, 1.0, -0.250653, -0.937752, 1.0, -0.347305, -0.897804, 1.0, -0.440394, -0.848644, 1.0, -0.528964, -0.790776, 1.0, -0.612106, -0.724793, 1.0, -0.688967, -0.651372, 1.0, -0.758758, -0.571268, 1.0, -0.820763, -0.485302, 1.0, -0.874347, -0.394356, 1.0, -0.918958, -0.299363, 1.0, -0.954139, -0.201298, 1.0, -0.97953, -0.197431, 0.960729, 0.97953, -0.293611, 0.941597, 0.954139, -0.386778, 0.923065, 0.918958, -0.475977, 0.905322, 0.874347, -0.560291, 0.888551, 0.820763, -0.638857, 0.872923, 0.758758, -0.710866, 0.8586, 0.688967, -0.775581, 0.845727, 0.612106, -0.832338, 0.834438, 0.528964, -0.880553, 0.824847, 0.440394, -0.919733, 0.817054, 0.347305, -0.949476, 0.811137, 0.250652, -0.969475, 0.807159, 0.151428, -0.979526, 0.80516, 0.0506491, -0.979526, 0.80516, -0.0506492, -0.969475, 0.807159, -0.151428, -0.949476, 0.811137, -0.250653, -0.919733, 0.817054, -0.347305, -0.880553, 0.824847, -0.440394, -0.832338, 0.834438, -0.528964, -0.775581, 0.845727, -0.612106, -0.710866, 0.8586, -0.688967, -0.638856, 0.872923, -0.758758, -0.560291, 0.888551, -0.820763, -0.475977, 0.905322, -0.874347, -0.386778, 0.923065, -0.918958, -0.293611, 0.941597, -0.954139, -0.197431, 0.960729, -0.97953, -0.185976, 0.922966, 0.97953, -0.276575, 0.885439, 0.954139, -0.364337, 0.849087, 0.918958, -0.448361, 0.814283, 0.874347, -0.527783, 0.781385, 0.820763, -0.60179, 0.75073, 0.758758, -0.669621, 0.722634, 0.688967, -0.730582, 0.697383, 0.612106, -0.784045, 0.675238, 0.528964, -0.829463, 0.656425, 0.440394, -0.86637, 0.641138, 0.347305, -0.894387, 0.629533, 0.250652, -0.913226, 0.621729, 0.151428, -0.922694, 0.617808, 0.0506491, -0.922694, 0.617808, -0.0506492, -0.913226, 0.621729, -0.151428, -0.894387, 0.629533, -0.250653, -0.86637, 0.641138, -0.347305, -0.829463, 0.656425, -0.440394, -0.784045, 0.675238, -0.528964, -0.730581, 0.697383, -0.612106, -0.669621, 0.722634, -0.688967, -0.60179, 0.750731, -0.758758, -0.527783, 0.781385, -0.820763, -0.44836, 0.814283, -0.874347, -0.364337, 0.849087, -0.918958, -0.276575, 0.885439, -0.954139, -0.185976, 0.922966, -0.97953, -0.167374, 0.888165, 0.97953, -0.248911, 0.833683, 0.954139, -0.327895, 0.780908, 0.918958, -0.403514, 0.730381, 0.874347, -0.474992, 0.68262, 0.820763, -0.541596, 0.638117, 0.758758, -0.602643, 0.597327, 0.688967, -0.657506, 0.560668, 0.612106, -0.705622, 0.528518, 0.528964, -0.746497, 0.501206, 0.440394, -0.779712, 0.479013, 0.347305, -0.804927, 0.462165, 0.250652, -0.821881, 0.450836, 0.151428, -0.830402, 0.445143, 0.0506491, -0.830402, 0.445143, -0.0506492, -0.821881, 0.450836, -0.151428, -0.804927, 0.462165, -0.250653, -0.779712, 0.479013, -0.347305, -0.746497, 0.501206, -0.440394, -0.705622, 0.528518, -0.528964, -0.657506, 0.560668, -0.612106, -0.602643, 0.597327, -0.688967, -0.541596, 0.638117, -0.758758, -0.474992, 0.68262, -0.820763, -0.403514, 0.730381, -0.874347, -0.327895, 0.780908, -0.918958, -0.248911, 0.833683, -0.954139, -0.167374, 0.888165, -0.97953, -0.14234, 0.85766, 0.97953, -0.211682, 0.788318, 0.954139, -0.278852, 0.721148, 0.918958, -0.34316, 0.65684, 0.874347, -0.403948, 0.596052, 0.820763, -0.46059, 0.53941, 0.758758, -0.512506, 0.487494, 0.688967, -0.559163, 0.440837, 0.612106, -0.600082, 0.399918, 0.528964, -0.634844, 0.365156, 0.440394, -0.663091, 0.336909, 0.347305, -0.684534, 0.315466, 0.250652, -0.698953, 0.301047, 0.151428, -0.706199, 0.293801, 0.0506491, -0.706199, 0.293801, -0.0506492, -0.698953, 0.301047, -0.151428, -0.684534, 0.315466, -0.250653, -0.663091, 0.336909, -0.347305, -0.634844, 0.365156, -0.440394, -0.600082, 0.399918, -0.528964, -0.559163, 0.440837, -0.612106, -0.512506, 0.487494, -0.688967, -0.46059, 0.53941, -0.758758, -0.403948, 0.596052, -0.820763, -0.34316, 0.65684, -0.874347, -0.278852, 0.721148, -0.918958, -0.211682, 0.788318, -0.954139, -0.142339, 0.85766, -0.97953, -0.111835, 0.832626, 0.97953, -0.166317, 0.751089, 0.954139, -0.219092, 0.672105, 0.918958, -0.269619, 0.596486, 0.874347, -0.31738, 0.525008, 0.820763, -0.361883, 0.458404, 0.758758, -0.402673, 0.397357, 0.688967, -0.439331, 0.342494, 0.612106, -0.471481, 0.294378, 0.528964, -0.498793, 0.253503, 0.440394, -0.520987, 0.220288, 0.347305, -0.537835, 0.195073, 0.250652, -0.549163, 0.178119, 0.151428, -0.554857, 0.169598, 0.0506491, -0.554857, 0.169598, -0.0506492, -0.549163, 0.178119, -0.151428, -0.537835, 0.195073, -0.250653, -0.520987, 0.220288, -0.347305, -0.498793, 0.253503, -0.440394, -0.471481, 0.294378, -0.528964, -0.439331, 0.342494, -0.612106, -0.402673, 0.397357, -0.688967, -0.361883, 0.458404, -0.758758, -0.31738, 0.525008, -0.820763, -0.269619, 0.596486, -0.874347, -0.219092, 0.672105, -0.918958, -0.166317, 0.751089, -0.954139, -0.111835, 0.832626, -0.97953, -0.0770336, 0.814024, 0.97953, -0.114561, 0.723424, 0.954139, -0.150913, 0.635663, 0.918958, -0.185717, 0.551639, 0.874347, -0.218615, 0.472217, 0.820763, -0.249269, 0.39821, 0.758758, -0.277366, 0.330379, 0.688967, -0.302617, 0.269418, 0.612106, -0.324762, 0.215955, 0.528964, -0.343575, 0.170537, 0.440394, -0.358862, 0.13363, 0.347305, -0.370467, 0.105613, 0.250652, -0.37827, 0.0867743, 0.151428, -0.382192, 0.0773062, 0.0506491, -0.382192, 0.0773062, -0.0506492, -0.37827, 0.0867743, -0.151428, -0.370467, 0.105613, -0.250653, -0.358862, 0.13363, -0.347305, -0.343575, 0.170537, -0.440394, -0.324762, 0.215955, -0.528964, -0.302617, 0.269418, -0.612106, -0.277366, 0.330379, -0.688967, -0.249269, 0.39821, -0.758758, -0.218615, 0.472217, -0.820763, -0.185717, 0.551639, -0.874347, -0.150913, 0.635663, -0.918958, -0.114561, 0.723425, -0.954139, -0.0770336, 0.814025, -0.97953, -0.0392714, 0.802569, 0.97953, -0.0584028, 0.706389, 0.954139, -0.076935, 0.613222, 0.918958, -0.0946777, 0.524023, 0.874347, -0.111449, 0.439709, 0.820763, -0.127076, 0.361143, 0.758758, -0.1414, 0.289134, 0.688967, -0.154273, 0.224419, 0.612106, -0.165562, 0.167662, 0.528964, -0.175153, 0.119446, 0.440394, -0.182946, 0.0802665, 0.347305, -0.188862, 0.0505242, 0.250652, -0.19284, 0.0305248, 0.151428, -0.19484, 0.0204735, 0.0506491, -0.19484, 0.0204735, -0.0506492, -0.19284, 0.0305248, -0.151428, -0.188862, 0.0505242, -0.250653, -0.182946, 0.0802665, -0.347305, -0.175153, 0.119447, -0.440394, -0.165562, 0.167662, -0.528964, -0.154273, 0.224419, -0.612106, -0.1414, 0.289134, -0.688967, -0.127076, 0.361143, -0.758758, -0.111449, 0.439709, -0.820763, -0.0946776, 0.524023, -0.874347, -0.0769349, 0.613222, -0.918958, -0.0584028, 0.706389, -0.954139, -0.0392714, 0.802569, -0.97953, 2.63971e-08, 0.798701, 0.97953, 3.92567e-08, 0.700637, 0.954139, 5.17135e-08, 0.605644, 0.918958, 6.36397e-08, 0.514698, 0.874347, 7.49128e-08, 0.428732, 0.820763, 8.54172e-08, 0.348628, 0.758758, 9.50451e-08, 0.275207, 0.688967, 1.03698e-07, 0.209224, 0.612106, 1.11286e-07, 0.151356, 0.528964, 1.17733e-07, 0.102195, 0.440394, 1.22971e-07, 0.0622479, 0.347305, 1.26948e-07, 0.0319229, 0.250652, 1.29622e-07, 0.0115317, 0.151428, 1.30966e-07, 0.00128349, 0.0506491, 1.30966e-07, 0.0012835, -0.0506492, 1.29622e-07, 0.0115317, -0.151428, 1.26948e-07, 0.0319229, -0.250653, 1.22971e-07, 0.0622479, -0.347305, 1.17733e-07, 0.102195, -0.440394, 1.11286e-07, 0.151356, -0.528964, 1.03698e-07, 0.209224, -0.612106, 9.50451e-08, 0.275207, -0.688967, 8.54172e-08, 0.348628, -0.758758, 7.49128e-08, 0.428732, -0.820763, 6.36397e-08, 0.514698, -0.874347, 5.17135e-08, 0.605644, -0.918958, 3.92567e-08, 0.700637, -0.954139, 2.63971e-08, 0.798702, -0.97953, 0.0392714, 0.802569, 0.97953, 0.0584029, 0.706389, 0.954139, 0.0769351, 0.613222, 0.918958, 0.0946778, 0.524023, 0.874347, 0.111449, 0.439709, 0.820763, 0.127077, 0.361143, 0.758758, 0.1414, 0.289134, 0.688967, 0.154273, 0.224419, 0.612106, 0.165562, 0.167662, 0.528964, 0.175153, 0.119447, 0.440394, 0.182946, 0.0802665, 0.347305, 0.188863, 0.0505242, 0.250652, 0.192841, 0.0305248, 0.151428, 0.19484, 0.0204736, 0.0506491, 0.19484, 0.0204736, -0.0506492, 0.192841, 0.0305248, -0.151428, 0.188863, 0.0505242, -0.250653, 0.182946, 0.0802666, -0.347305, 0.175153, 0.119447, -0.440394, 0.165562, 0.167662, -0.528964, 0.154273, 0.224419, -0.612106, 0.1414, 0.289134, -0.688967, 0.127077, 0.361144, -0.758758, 0.111449, 0.439709, -0.820763, 0.0946778, 0.524023, -0.874347, 0.0769351, 0.613222, -0.918958, 0.0584029, 0.706389, -0.954139, 0.0392714, 0.802569, -0.97953, 0.0770336, 0.814024, 0.97953, 0.114561, 0.723425, 0.954139, 0.150914, 0.635663, 0.918958, 0.185717, 0.551639, 0.874347, 0.218615, 0.472217, 0.820763, 0.24927, 0.39821, 0.758758, 0.277366, 0.330379, 0.688967, 0.302617, 0.269419, 0.612106, 0.324762, 0.215955, 0.528964, 0.343575, 0.170537, 0.440394, 0.358862, 0.13363, 0.347305, 0.370467, 0.105613, 0.250652, 0.378271, 0.0867744, 0.151428, 0.382192, 0.0773063, 0.0506491, 0.382192, 0.0773063, -0.0506492, 0.378271, 0.0867744, -0.151428, 0.370467, 0.105613, -0.250653, 0.358862, 0.13363, -0.347305, 0.343575, 0.170537, -0.440394, 0.324762, 0.215955, -0.528964, 0.302617, 0.269419, -0.612106, 0.277366, 0.330379, -0.688967, 0.24927, 0.39821, -0.758758, 0.218615, 0.472217, -0.820763, 0.185717, 0.55164, -0.874347, 0.150913, 0.635663, -0.918958, 0.114561, 0.723425, -0.954139, 0.0770336, 0.814025, -0.97953, 0.111835, 0.832626, 0.97953, 0.166317, 0.751089, 0.954139, 0.219092, 0.672105, 0.918958, 0.269619, 0.596486, 0.874347, 0.31738, 0.525008, 0.820763, 0.361883, 0.458404, 0.758758, 0.402673, 0.397357, 0.688967, 0.439332, 0.342494, 0.612106, 0.471482, 0.294378, 0.528964, 0.498794, 0.253503, 0.440394, 0.520987, 0.220288, 0.347305, 0.537835, 0.195073, 0.250652, 0.549164, 0.178119, 0.151428, 0.554857, 0.169598, 0.0506491, 0.554857, 0.169598, -0.0506492, 0.549164, 0.178119, -0.151428, 0.537835, 0.195073, -0.250653, 0.520987, 0.220288, -0.347305, 0.498794, 0.253503, -0.440394, 0.471482, 0.294378, -0.528964, 0.439332, 0.342494, -0.612106, 0.402673, 0.397357, -0.688967, 0.361883, 0.458404, -0.758758, 0.31738, 0.525008, -0.820763, 0.269619, 0.596486, -0.874347, 0.219092, 0.672105, -0.918958, 0.166317, 0.751089, -0.954139, 0.111835, 0.832626, -0.97953, 0.14234, 0.85766, 0.97953, 0.211682, 0.788318, 0.954139, 0.278852, 0.721148, 0.918958, 0.34316, 0.65684, 0.874347, 0.403948, 0.596052, 0.820763, 0.46059, 0.53941, 0.758758, 0.512506, 0.487494, 0.688967, 0.559163, 0.440837, 0.612106, 0.600082, 0.399918, 0.528964, 0.634844, 0.365156, 0.440394, 0.663091, 0.336909, 0.347305, 0.684534, 0.315466, 0.250652, 0.698953, 0.301047, 0.151428, 0.706199, 0.293801, 0.0506491, 0.706199, 0.293801, -0.0506492, 0.698953, 0.301047, -0.151428, 0.684534, 0.315466, -0.250653, 0.663091, 0.336909, -0.347305, 0.634844, 0.365156, -0.440394, 0.600082, 0.399918, -0.528964, 0.559163, 0.440837, -0.612106, 0.512506, 0.487494, -0.688967, 0.46059, 0.53941, -0.758758, 0.403948, 0.596052, -0.820763, 0.34316, 0.65684, -0.874347, 0.278852, 0.721148, -0.918958, 0.211682, 0.788318, -0.954139, 0.14234, 0.857661, -0.97953, 0.167374, 0.888165, 0.97953, 0.248911, 0.833683, 0.954139, 0.327895, 0.780908, 0.918958, 0.403514, 0.730381, 0.874347, 0.474992, 0.68262, 0.820763, 0.541596, 0.638117, 0.758758, 0.602643, 0.597327, 0.688967, 0.657506, 0.560669, 0.612106, 0.705622, 0.528519, 0.528964, 0.746497, 0.501207, 0.440394, 0.779712, 0.479013, 0.347305, 0.804927, 0.462165, 0.250652, 0.821881, 0.450837, 0.151428, 0.830402, 0.445143, 0.0506491, 0.830402, 0.445143, -0.0506492, 0.821881, 0.450837, -0.151428, 0.804927, 0.462165, -0.250653, 0.779712, 0.479013, -0.347305, 0.746497, 0.501207, -0.440394, 0.705622, 0.528519, -0.528964, 0.657506, 0.560669, -0.612106, 0.602643, 0.597327, -0.688967, 0.541596, 0.638117, -0.758758, 0.474992, 0.68262, -0.820763, 0.403514, 0.730381, -0.874347, 0.327895, 0.780908, -0.918958, 0.248911, 0.833683, -0.954139, 0.167374, 0.888165, -0.97953, 0.185976, 0.922966, 0.97953, 0.276575, 0.885439, 0.954139, 0.364337, 0.849087, 0.918958, 0.448361, 0.814283, 0.874347, 0.527783, 0.781385, 0.820763, 0.60179, 0.750731, 0.758758, 0.669621, 0.722634, 0.688967, 0.730582, 0.697383, 0.612106, 0.784045, 0.675238, 0.528964, 0.829463, 0.656425, 0.440394, 0.86637, 0.641138, 0.347305, 0.894387, 0.629533, 0.250652, 0.913226, 0.62173, 0.151428, 0.922694, 0.617808, 0.0506491, 0.922694, 0.617808, -0.0506492, 0.913226, 0.62173, -0.151428, 0.894387, 0.629533, -0.250653, 0.86637, 0.641138, -0.347305, 0.829463, 0.656425, -0.440394, 0.784045, 0.675238, -0.528964, 0.730582, 0.697383, -0.612106, 0.669621, 0.722634, -0.688967, 0.60179, 0.750731, -0.758758, 0.527783, 0.781385, -0.820763, 0.448361, 0.814283, -0.874347, 0.364337, 0.849087, -0.918958, 0.276575, 0.885439, -0.954139, 0.185976, 0.922966, -0.97953, 0.197431, 0.960729, 0.97953, 0.293611, 0.941597, 0.954139, 0.386778, 0.923065, 0.918958, 0.475977, 0.905322, 0.874347, 0.560291, 0.888551, 0.820763, 0.638857, 0.872924, 0.758758, 0.710866, 0.8586, 0.688967, 0.775581, 0.845727, 0.612106, 0.832338, 0.834438, 0.528964, 0.880554, 0.824847, 0.440394, 0.919734, 0.817054, 0.347305, 0.949476, 0.811138, 0.250652, 0.969475, 0.80716, 0.151428, 0.979526, 0.80516, 0.0506491, 0.979526, 0.80516, -0.0506492, 0.969475, 0.80716, -0.151428, 0.949476, 0.811138, -0.250653, 0.919734, 0.817054, -0.347305, 0.880553, 0.824847, -0.440394, 0.832338, 0.834438, -0.528964, 0.775581, 0.845727, -0.612106, 0.710866, 0.8586, -0.688967, 0.638857, 0.872924, -0.758758, 0.560291, 0.888551, -0.820763, 0.475977, 0.905322, -0.874347, 0.386778, 0.923065, -0.918958, 0.293611, 0.941597, -0.954139, 0.197431, 0.960729, -0.97953],
    "indices": [0, 1, 2, 1, 3, 2, 3, 4, 2, 4, 5, 2, 5, 6, 2, 6, 7, 2, 7, 8, 2, 8, 9, 2, 9, 10, 2, 10, 11, 2, 11, 12, 2, 12, 13, 2, 13, 14, 2, 14, 15, 2, 15, 16, 2, 16, 17, 2, 17, 18, 2, 18, 19, 2, 19, 20, 2, 20, 21, 2, 21, 22, 2, 22, 23, 2, 23, 24, 2, 24, 25, 2, 25, 26, 2, 26, 27, 2, 27, 28, 2, 28, 29, 2, 29, 30, 2, 30, 31, 2, 31, 32, 2, 32, 0, 2, 33, 34, 35, 35, 34, 36, 36, 34, 37, 37, 34, 38, 38, 34, 39, 39, 34, 40, 40, 34, 41, 41, 34, 42, 42, 34, 43, 43, 34, 44, 44, 34, 45, 45, 34, 46, 46, 34, 47, 47, 34, 48, 48, 34, 49, 49, 34, 50, 50, 34, 51, 51, 34, 52, 52, 34, 53, 53, 34, 54, 54, 34, 55, 55, 34, 56, 56, 34, 57, 57, 34, 58, 58, 34, 59, 59, 34, 60, 60, 34, 61, 61, 34, 62, 62, 34, 63, 63, 34, 64, 64, 34, 65, 65, 34, 33, 0, 66, 67, 0, 67, 1, 66, 68, 69, 66, 69, 67, 68, 70, 71, 68, 71, 69, 70, 72, 73, 70, 73, 71, 72, 74, 75, 72, 75, 73, 74, 76, 77, 74, 77, 75, 76, 78, 79, 76, 79, 77, 78, 80, 81, 78, 81, 79, 80, 82, 83, 80, 83, 81, 82, 84, 85, 82, 85, 83, 84, 86, 87, 84, 87, 85, 86, 88, 89, 86, 89, 87, 88, 90, 91, 88, 91, 89, 90, 92, 93, 90, 93, 91, 92, 94, 95, 92, 95, 93, 94, 96, 97, 94, 97, 95, 96, 98, 99, 96, 99, 97, 98, 100, 101, 98, 101, 99, 100, 102, 103, 100, 103, 101, 102, 104, 105, 102, 105, 103, 104, 106, 107, 104, 107, 105, 106, 108, 109, 106, 109, 107, 108, 110, 111, 108, 111, 109, 110, 112, 113, 110, 113, 111, 112, 114, 115, 112, 115, 113, 114, 116, 117, 114, 117, 115, 116, 118, 119, 116, 119, 117, 118, 120, 121, 118, 121, 119, 120, 33, 35, 120, 35, 121, 1, 67, 122, 1, 122, 3, 67, 69, 123, 67, 123, 122, 69, 71, 124, 69, 124, 123, 71, 73, 125, 71, 125, 124, 73, 75, 126, 73, 126, 125, 75, 77, 127, 75, 127, 126, 77, 79, 128, 77, 128, 127, 79, 81, 129, 79, 129, 128, 81, 83, 130, 81, 130, 129, 83, 85, 131, 83, 131, 130, 85, 87, 132, 85, 132, 131, 87, 89, 133, 87, 133, 132, 89, 91, 134, 89, 134, 133, 91, 93, 135, 91, 135, 134, 93, 95, 136, 93, 136, 135, 95, 97, 137, 95, 137, 136, 97, 99, 138, 97, 138, 137, 99, 101, 139, 99, 139, 138, 101, 103, 140, 101, 140, 139, 103, 105, 141, 103, 141, 140, 105, 107, 142, 105, 142, 141, 107, 109, 143, 107, 143, 142, 109, 111, 144, 109, 144, 143, 111, 113, 145, 111, 145, 144, 113, 115, 146, 113, 146, 145, 115, 117, 147, 115, 147, 146, 117, 119, 148, 117, 148, 147, 119, 121, 149, 119, 149, 148, 121, 35, 36, 121, 36, 149, 3, 122, 150, 3, 150, 4, 122, 123, 151, 122, 151, 150, 123, 124, 152, 123, 152, 151, 124, 125, 153, 124, 153, 152, 125, 126, 154, 125, 154, 153, 126, 127, 155, 126, 155, 154, 127, 128, 156, 127, 156, 155, 128, 129, 157, 128, 157, 156, 129, 130, 158, 129, 158, 157, 130, 131, 159, 130, 159, 158, 131, 132, 160, 131, 160, 159, 132, 133, 161, 132, 161, 160, 133, 134, 162, 133, 162, 161, 134, 135, 163, 134, 163, 162, 135, 136, 164, 135, 164, 163, 136, 137, 165, 136, 165, 164, 137, 138, 166, 137, 166, 165, 138, 139, 167, 138, 167, 166, 139, 140, 168, 139, 168, 167, 140, 141, 169, 140, 169, 168, 141, 142, 170, 141, 170, 169, 142, 143, 171, 142, 171, 170, 143, 144, 172, 143, 172, 171, 144, 145, 173, 144, 173, 172, 145, 146, 174, 145, 174, 173, 146, 147, 175, 146, 175, 174, 147, 148, 176, 147, 176, 175, 148, 149, 177, 148, 177, 176, 149, 36, 37, 149, 37, 177, 4, 150, 178, 4, 178, 5, 150, 151, 179, 150, 179, 178, 151, 152, 180, 151, 180, 179, 152, 153, 181, 152, 181, 180, 153, 154, 182, 153, 182, 181, 154, 155, 183, 154, 183, 182, 155, 156, 184, 155, 184, 183, 156, 157, 185, 156, 185, 184, 157, 158, 186, 157, 186, 185, 158, 159, 187, 158, 187, 186, 159, 160, 188, 159, 188, 187, 160, 161, 189, 160, 189, 188, 161, 162, 190, 161, 190, 189, 162, 163, 191, 162, 191, 190, 163, 164, 192, 163, 192, 191, 164, 165, 193, 164, 193, 192, 165, 166, 194, 165, 194, 193, 166, 167, 195, 166, 195, 194, 167, 168, 196, 167, 196, 195, 168, 169, 197, 168, 197, 196, 169, 170, 198, 169, 198, 197, 170, 171, 199, 170, 199, 198, 171, 172, 200, 171, 200, 199, 172, 173, 201, 172, 201, 200, 173, 174, 202, 173, 202, 201, 174, 175, 203, 174, 203, 202, 175, 176, 204, 175, 204, 203, 176, 177, 205, 176, 205, 204, 177, 37, 38, 177, 38, 205, 5, 178, 206, 5, 206, 6, 178, 179, 207, 178, 207, 206, 179, 180, 208, 179, 208, 207, 180, 181, 209, 180, 209, 208, 181, 182, 210, 181, 210, 209, 182, 183, 211, 182, 211, 210, 183, 184, 212, 183, 212, 211, 184, 185, 213, 184, 213, 212, 185, 186, 214, 185, 214, 213, 186, 187, 215, 186, 215, 214, 187, 188, 216, 187, 216, 215, 188, 189, 217, 188, 217, 216, 189, 190, 218, 189, 218, 217, 190, 191, 219, 190, 219, 218, 191, 192, 220, 191, 220, 219, 192, 193, 221, 192, 221, 220, 193, 194, 222, 193, 222, 221, 194, 195, 223, 194, 223, 222, 195, 196, 224, 195, 224, 223, 196, 197, 225, 196, 225, 224, 197, 198, 226, 197, 226, 225, 198, 199, 227, 198, 227, 226, 199, 200, 228, 199, 228, 227, 200, 201, 229, 200, 229, 228, 201, 202, 230, 201, 230, 229, 202, 203, 231, 202, 231, 230, 203, 204, 232, 203, 232, 231, 204, 205, 233, 204, 233, 232, 205, 38, 39, 205, 39, 233, 6, 206, 234, 6, 234, 7, 206, 207, 235, 206, 235, 234, 207, 208, 236, 207, 236, 235, 208, 209, 237, 208, 237, 236, 209, 210, 238, 209, 238, 237, 210, 211, 239, 210, 239, 238, 211, 212, 240, 211, 240, 239, 212, 213, 241, 212, 241, 240, 213, 214, 242, 213, 242, 241, 214, 215, 243, 214, 243, 242, 215, 216, 244, 215, 244, 243, 216, 217, 245, 216, 245, 244, 217, 218, 246, 217, 246, 245, 218, 219, 247, 218, 247, 246, 219, 220, 248, 219, 248, 247, 220, 221, 249, 220, 249, 248, 221, 222, 250, 221, 250, 249, 222, 223, 251, 222, 251, 250, 223, 224, 252, 223, 252, 251, 224, 225, 253, 224, 253, 252, 225, 226, 254, 225, 254, 253, 226, 227, 255, 226, 255, 254, 227, 228, 256, 227, 256, 255, 228, 229, 257, 228, 257, 256, 229, 230, 258, 229, 258, 257, 230, 231, 259, 230, 259, 258, 231, 232, 260, 231, 260, 259, 232, 233, 261, 232, 261, 260, 233, 39, 40, 233, 40, 261, 7, 234, 262, 7, 262, 8, 234, 235, 263, 234, 263, 262, 235, 236, 264, 235, 264, 263, 236, 237, 265, 236, 265, 264, 237, 238, 266, 237, 266, 265, 238, 239, 267, 238, 267, 266, 239, 240, 268, 239, 268, 267, 240, 241, 269, 240, 269, 268, 241, 242, 270, 241, 270, 269, 242, 243, 271, 242, 271, 270, 243, 244, 272, 243, 272, 271, 244, 245, 273, 244, 273, 272, 245, 246, 274, 245, 274, 273, 246, 247, 275, 246, 275, 274, 247, 248, 276, 247, 276, 275, 248, 249, 277, 248, 277, 276, 249, 250, 278, 249, 278, 277, 250, 251, 279, 250, 279, 278, 251, 252, 280, 251, 280, 279, 252, 253, 281, 252, 281, 280, 253, 254, 282, 253, 282, 281, 254, 255, 283, 254, 283, 282, 255, 256, 284, 255, 284, 283, 256, 257, 285, 256, 285, 284, 257, 258, 286, 257, 286, 285, 258, 259, 287, 258, 287, 286, 259, 260, 288, 259, 288, 287, 260, 261, 289, 260, 289, 288, 261, 40, 41, 261, 41, 289, 8, 262, 290, 8, 290, 9, 262, 263, 291, 262, 291, 290, 263, 264, 292, 263, 292, 291, 264, 265, 293, 264, 293, 292, 265, 266, 294, 265, 294, 293, 266, 267, 295, 266, 295, 294, 267, 268, 296, 267, 296, 295, 268, 269, 297, 268, 297, 296, 269, 270, 298, 269, 298, 297, 270, 271, 299, 270, 299, 298, 271, 272, 300, 271, 300, 299, 272, 273, 301, 272, 301, 300, 273, 274, 302, 273, 302, 301, 274, 275, 303, 274, 303, 302, 275, 276, 304, 275, 304, 303, 276, 277, 305, 276, 305, 304, 277, 278, 306, 277, 306, 305, 278, 279, 307, 278, 307, 306, 279, 280, 308, 279, 308, 307, 280, 281, 309, 280, 309, 308, 281, 282, 310, 281, 310, 309, 282, 283, 311, 282, 311, 310, 283, 284, 312, 283, 312, 311, 284, 285, 313, 284, 313, 312, 285, 286, 314, 285, 314, 313, 286, 287, 315, 286, 315, 314, 287, 288, 316, 287, 316, 315, 288, 289, 317, 288, 317, 316, 289, 41, 42, 289, 42, 317, 9, 290, 318, 9, 318, 10, 290, 291, 319, 290, 319, 318, 291, 292, 320, 291, 320, 319, 292, 293, 321, 292, 321, 320, 293, 294, 322, 293, 322, 321, 294, 295, 323, 294, 323, 322, 295, 296, 324, 295, 324, 323, 296, 297, 325, 296, 325, 324, 297, 298, 326, 297, 326, 325, 298, 299, 327, 298, 327, 326, 299, 300, 328, 299, 328, 327, 300, 301, 329, 300, 329, 328, 301, 302, 330, 301, 330, 329, 302, 303, 331, 302, 331, 330, 303, 304, 332, 303, 332, 331, 304, 305, 333, 304, 333, 332, 305, 306, 334, 305, 334, 333, 306, 307, 335, 306, 335, 334, 307, 308, 336, 307, 336, 335, 308, 309, 337, 308, 337, 336, 309, 310, 338, 309, 338, 337, 310, 311, 339, 310, 339, 338, 311, 312, 340, 311, 340, 339, 312, 313, 341, 312, 341, 340, 313, 314, 342, 313, 342, 341, 314, 315, 343, 314, 343, 342, 315, 316, 344, 315, 344, 343, 316, 317, 345, 316, 345, 344, 317, 42, 43, 317, 43, 345, 10, 318, 346, 10, 346, 11, 318, 319, 347, 318, 347, 346, 319, 320, 348, 319, 348, 347, 320, 321, 349, 320, 349, 348, 321, 322, 350, 321, 350, 349, 322, 323, 351, 322, 351, 350, 323, 324, 352, 323, 352, 351, 324, 325, 353, 324, 353, 352, 325, 326, 354, 325, 354, 353, 326, 327, 355, 326, 355, 354, 327, 328, 356, 327, 356, 355, 328, 329, 357, 328, 357, 356, 329, 330, 358, 329, 358, 357, 330, 331, 359, 330, 359, 358, 331, 332, 360, 331, 360, 359, 332, 333, 361, 332, 361, 360, 333, 334, 362, 333, 362, 361, 334, 335, 363, 334, 363, 362, 335, 336, 364, 335, 364, 363, 336, 337, 365, 336, 365, 364, 337, 338, 366, 337, 366, 365, 338, 339, 367, 338, 367, 366, 339, 340, 368, 339, 368, 367, 340, 341, 369, 340, 369, 368, 341, 342, 370, 341, 370, 369, 342, 343, 371, 342, 371, 370, 343, 344, 372, 343, 372, 371, 344, 345, 373, 344, 373, 372, 345, 43, 44, 345, 44, 373, 11, 346, 374, 11, 374, 12, 346, 347, 375, 346, 375, 374, 347, 348, 376, 347, 376, 375, 348, 349, 377, 348, 377, 376, 349, 350, 378, 349, 378, 377, 350, 351, 379, 350, 379, 378, 351, 352, 380, 351, 380, 379, 352, 353, 381, 352, 381, 380, 353, 354, 382, 353, 382, 381, 354, 355, 383, 354, 383, 382, 355, 356, 384, 355, 384, 383, 356, 357, 385, 356, 385, 384, 357, 358, 386, 357, 386, 385, 358, 359, 387, 358, 387, 386, 359, 360, 388, 359, 388, 387, 360, 361, 389, 360, 389, 388, 361, 362, 390, 361, 390, 389, 362, 363, 391, 362, 391, 390, 363, 364, 392, 363, 392, 391, 364, 365, 393, 364, 393, 392, 365, 366, 394, 365, 394, 393, 366, 367, 395, 366, 395, 394, 367, 368, 396, 367, 396, 395, 368, 369, 397, 368, 397, 396, 369, 370, 398, 369, 398, 397, 370, 371, 399, 370, 399, 398, 371, 372, 400, 371, 400, 399, 372, 373, 401, 372, 401, 400, 373, 44, 45, 373, 45, 401, 12, 374, 402, 12, 402, 13, 374, 375, 403, 374, 403, 402, 375, 376, 404, 375, 404, 403, 376, 377, 405, 376, 405, 404, 377, 378, 406, 377, 406, 405, 378, 379, 407, 378, 407, 406, 379, 380, 408, 379, 408, 407, 380, 381, 409, 380, 409, 408, 381, 382, 410, 381, 410, 409, 382, 383, 411, 382, 411, 410, 383, 384, 412, 383, 412, 411, 384, 385, 413, 384, 413, 412, 385, 386, 414, 385, 414, 413, 386, 387, 415, 386, 415, 414, 387, 388, 416, 387, 416, 415, 388, 389, 417, 388, 417, 416, 389, 390, 418, 389, 418, 417, 390, 391, 419, 390, 419, 418, 391, 392, 420, 391, 420, 419, 392, 393, 421, 392, 421, 420, 393, 394, 422, 393, 422, 421, 394, 395, 423, 394, 423, 422, 395, 396, 424, 395, 424, 423, 396, 397, 425, 396, 425, 424, 397, 398, 426, 397, 426, 425, 398, 399, 427, 398, 427, 426, 399, 400, 428, 399, 428, 427, 400, 401, 429, 400, 429, 428, 401, 45, 46, 401, 46, 429, 13, 402, 430, 13, 430, 14, 402, 403, 431, 402, 431, 430, 403, 404, 432, 403, 432, 431, 404, 405, 433, 404, 433, 432, 405, 406, 434, 405, 434, 433, 406, 407, 435, 406, 435, 434, 407, 408, 436, 407, 436, 435, 408, 409, 437, 408, 437, 436, 409, 410, 438, 409, 438, 437, 410, 411, 439, 410, 439, 438, 411, 412, 440, 411, 440, 439, 412, 413, 441, 412, 441, 440, 413, 414, 442, 413, 442, 441, 414, 415, 443, 414, 443, 442, 415, 416, 444, 415, 444, 443, 416, 417, 445, 416, 445, 444, 417, 418, 446, 417, 446, 445, 418, 419, 447, 418, 447, 446, 419, 420, 448, 419, 448, 447, 420, 421, 449, 420, 449, 448, 421, 422, 450, 421, 450, 449, 422, 423, 451, 422, 451, 450, 423, 424, 452, 423, 452, 451, 424, 425, 453, 424, 453, 452, 425, 426, 454, 425, 454, 453, 426, 427, 455, 426, 455, 454, 427, 428, 456, 427, 456, 455, 428, 429, 457, 428, 457, 456, 429, 46, 47, 429, 47, 457, 14, 430, 458, 14, 458, 15, 430, 431, 459, 430, 459, 458, 431, 432, 460, 431, 460, 459, 432, 433, 461, 432, 461, 460, 433, 434, 462, 433, 462, 461, 434, 435, 463, 434, 463, 462, 435, 436, 464, 435, 464, 463, 436, 437, 465, 436, 465, 464, 437, 438, 466, 437, 466, 465, 438, 439, 467, 438, 467, 466, 439, 440, 468, 439, 468, 467, 440, 441, 469, 440, 469, 468, 441, 442, 470, 441, 470, 469, 442, 443, 471, 442, 471, 470, 443, 444, 472, 443, 472, 471, 444, 445, 473, 444, 473, 472, 445, 446, 474, 445, 474, 473, 446, 447, 475, 446, 475, 474, 447, 448, 476, 447, 476, 475, 448, 449, 477, 448, 477, 476, 449, 450, 478, 449, 478, 477, 450, 451, 479, 450, 479, 478, 451, 452, 480, 451, 480, 479, 452, 453, 481, 452, 481, 480, 453, 454, 482, 453, 482, 481, 454, 455, 483, 454, 483, 482, 455, 456, 484, 455, 484, 483, 456, 457, 485, 456, 485, 484, 457, 47, 48, 457, 48, 485, 15, 458, 486, 15, 486, 16, 458, 459, 487, 458, 487, 486, 459, 460, 488, 459, 488, 487, 460, 461, 489, 460, 489, 488, 461, 462, 490, 461, 490, 489, 462, 463, 491, 462, 491, 490, 463, 464, 492, 463, 492, 491, 464, 465, 493, 464, 493, 492, 465, 466, 494, 465, 494, 493, 466, 467, 495, 466, 495, 494, 467, 468, 496, 467, 496, 495, 468, 469, 497, 468, 497, 496, 469, 470, 498, 469, 498, 497, 470, 471, 499, 470, 499, 498, 471, 472, 500, 471, 500, 499, 472, 473, 501, 472, 501, 500, 473, 474, 502, 473, 502, 501, 474, 475, 503, 474, 503, 502, 475, 476, 504, 475, 504, 503, 476, 477, 505, 476, 505, 504, 477, 478, 506, 477, 506, 505, 478, 479, 507, 478, 507, 506, 479, 480, 508, 479, 508, 507, 480, 481, 509, 480, 509, 508, 481, 482, 510, 481, 510, 509, 482, 483, 511, 482, 511, 510, 483, 484, 512, 483, 512, 511, 484, 485, 513, 484, 513, 512, 485, 48, 49, 485, 49, 513, 16, 486, 514, 16, 514, 17, 486, 487, 515, 486, 515, 514, 487, 488, 516, 487, 516, 515, 488, 489, 517, 488, 517, 516, 489, 490, 518, 489, 518, 517, 490, 491, 519, 490, 519, 518, 491, 492, 520, 491, 520, 519, 492, 493, 521, 492, 521, 520, 493, 494, 522, 493, 522, 521, 494, 495, 523, 494, 523, 522, 495, 496, 524, 495, 524, 523, 496, 497, 525, 496, 525, 524, 497, 498, 526, 497, 526, 525, 498, 499, 527, 498, 527, 526, 499, 500, 528, 499, 528, 527, 500, 501, 529, 500, 529, 528, 501, 502, 530, 501, 530, 529, 502, 503, 531, 502, 531, 530, 503, 504, 532, 503, 532, 531, 504, 505, 533, 504, 533, 532, 505, 506, 534, 505, 534, 533, 506, 507, 535, 506, 535, 534, 507, 508, 536, 507, 536, 535, 508, 509, 537, 508, 537, 536, 509, 510, 538, 509, 538, 537, 510, 511, 539, 510, 539, 538, 511, 512, 540, 511, 540, 539, 512, 513, 541, 512, 541, 540, 513, 49, 50, 513, 50, 541, 17, 514, 542, 17, 542, 18, 514, 515, 543, 514, 543, 542, 515, 516, 544, 515, 544, 543, 516, 517, 545, 516, 545, 544, 517, 518, 546, 517, 546, 545, 518, 519, 547, 518, 547, 546, 519, 520, 548, 519, 548, 547, 520, 521, 549, 520, 549, 548, 521, 522, 550, 521, 550, 549, 522, 523, 551, 522, 551, 550, 523, 524, 552, 523, 552, 551, 524, 525, 553, 524, 553, 552, 525, 526, 554, 525, 554, 553, 526, 527, 555, 526, 555, 554, 527, 528, 556, 527, 556, 555, 528, 529, 557, 528, 557, 556, 529, 530, 558, 529, 558, 557, 530, 531, 559, 530, 559, 558, 531, 532, 560, 531, 560, 559, 532, 533, 561, 532, 561, 560, 533, 534, 562, 533, 562, 561, 534, 535, 563, 534, 563, 562, 535, 536, 564, 535, 564, 563, 536, 537, 565, 536, 565, 564, 537, 538, 566, 537, 566, 565, 538, 539, 567, 538, 567, 566, 539, 540, 568, 539, 568, 567, 540, 541, 569, 540, 569, 568, 541, 50, 51, 541, 51, 569, 18, 542, 570, 18, 570, 19, 542, 543, 571, 542, 571, 570, 543, 544, 572, 543, 572, 571, 544, 545, 573, 544, 573, 572, 545, 546, 574, 545, 574, 573, 546, 547, 575, 546, 575, 574, 547, 548, 576, 547, 576, 575, 548, 549, 577, 548, 577, 576, 549, 550, 578, 549, 578, 577, 550, 551, 579, 550, 579, 578, 551, 552, 580, 551, 580, 579, 552, 553, 581, 552, 581, 580, 553, 554, 582, 553, 582, 581, 554, 555, 583, 554, 583, 582, 555, 556, 584, 555, 584, 583, 556, 557, 585, 556, 585, 584, 557, 558, 586, 557, 586, 585, 558, 559, 587, 558, 587, 586, 559, 560, 588, 559, 588, 587, 560, 561, 589, 560, 589, 588, 561, 562, 590, 561, 590, 589, 562, 563, 591, 562, 591, 590, 563, 564, 592, 563, 592, 591, 564, 565, 593, 564, 593, 592, 565, 566, 594, 565, 594, 593, 566, 567, 595, 566, 595, 594, 567, 568, 596, 567, 596, 595, 568, 569, 597, 568, 597, 596, 569, 51, 52, 569, 52, 597, 19, 570, 598, 19, 598, 20, 570, 571, 599, 570, 599, 598, 571, 572, 600, 571, 600, 599, 572, 573, 601, 572, 601, 600, 573, 574, 602, 573, 602, 601, 574, 575, 603, 574, 603, 602, 575, 576, 604, 575, 604, 603, 576, 577, 605, 576, 605, 604, 577, 578, 606, 577, 606, 605, 578, 579, 607, 578, 607, 606, 579, 580, 608, 579, 608, 607, 580, 581, 609, 580, 609, 608, 581, 582, 610, 581, 610, 609, 582, 583, 611, 582, 611, 610, 583, 584, 612, 583, 612, 611, 584, 585, 613, 584, 613, 612, 585, 586, 614, 585, 614, 613, 586, 587, 615, 586, 615, 614, 587, 588, 616, 587, 616, 615, 588, 589, 617, 588, 617, 616, 589, 590, 618, 589, 618, 617, 590, 591, 619, 590, 619, 618, 591, 592, 620, 591, 620, 619, 592, 593, 621, 592, 621, 620, 593, 594, 622, 593, 622, 621, 594, 595, 623, 594, 623, 622, 595, 596, 624, 595, 624, 623, 596, 597, 625, 596, 625, 624, 597, 52, 53, 597, 53, 625, 20, 598, 626, 20, 626, 21, 598, 599, 627, 598, 627, 626, 599, 600, 628, 599, 628, 627, 600, 601, 629, 600, 629, 628, 601, 602, 630, 601, 630, 629, 602, 603, 631, 602, 631, 630, 603, 604, 632, 603, 632, 631, 604, 605, 633, 604, 633, 632, 605, 606, 634, 605, 634, 633, 606, 607, 635, 606, 635, 634, 607, 608, 636, 607, 636, 635, 608, 609, 637, 608, 637, 636, 609, 610, 638, 609, 638, 637, 610, 611, 639, 610, 639, 638, 611, 612, 640, 611, 640, 639, 612, 613, 641, 612, 641, 640, 613, 614, 642, 613, 642, 641, 614, 615, 643, 614, 643, 642, 615, 616, 644, 615, 644, 643, 616, 617, 645, 616, 645, 644, 617, 618, 646, 617, 646, 645, 618, 619, 647, 618, 647, 646, 619, 620, 648, 619, 648, 647, 620, 621, 649, 620, 649, 648, 621, 622, 650, 621, 650, 649, 622, 623, 651, 622, 651, 650, 623, 624, 652, 623, 652, 651, 624, 625, 653, 624, 653, 652, 625, 53, 54, 625, 54, 653, 21, 626, 654, 21, 654, 22, 626, 627, 655, 626, 655, 654, 627, 628, 656, 627, 656, 655, 628, 629, 657, 628, 657, 656, 629, 630, 658, 629, 658, 657, 630, 631, 659, 630, 659, 658, 631, 632, 660, 631, 660, 659, 632, 633, 661, 632, 661, 660, 633, 634, 662, 633, 662, 661, 634, 635, 663, 634, 663, 662, 635, 636, 664, 635, 664, 663, 636, 637, 665, 636, 665, 664, 637, 638, 666, 637, 666, 665, 638, 639, 667, 638, 667, 666, 639, 640, 668, 639, 668, 667, 640, 641, 669, 640, 669, 668, 641, 642, 670, 641, 670, 669, 642, 643, 671, 642, 671, 670, 643, 644, 672, 643, 672, 671, 644, 645, 673, 644, 673, 672, 645, 646, 674, 645, 674, 673, 646, 647, 675, 646, 675, 674, 647, 648, 676, 647, 676, 675, 648, 649, 677, 648, 677, 676, 649, 650, 678, 649, 678, 677, 650, 651, 679, 650, 679, 678, 651, 652, 680, 651, 680, 679, 652, 653, 681, 652, 681, 680, 653, 54, 55, 653, 55, 681, 22, 654, 682, 22, 682, 23, 654, 655, 683, 654, 683, 682, 655, 656, 684, 655, 684, 683, 656, 657, 685, 656, 685, 684, 657, 658, 686, 657, 686, 685, 658, 659, 687, 658, 687, 686, 659, 660, 688, 659, 688, 687, 660, 661, 689, 660, 689, 688, 661, 662, 690, 661, 690, 689, 662, 663, 691, 662, 691, 690, 663, 664, 692, 663, 692, 691, 664, 665, 693, 664, 693, 692, 665, 666, 694, 665, 694, 693, 666, 667, 695, 666, 695, 694, 667, 668, 696, 667, 696, 695, 668, 669, 697, 668, 697, 696, 669, 670, 698, 669, 698, 697, 670, 671, 699, 670, 699, 698, 671, 672, 700, 671, 700, 699, 672, 673, 701, 672, 701, 700, 673, 674, 702, 673, 702, 701, 674, 675, 703, 674, 703, 702, 675, 676, 704, 675, 704, 703, 676, 677, 705, 676, 705, 704, 677, 678, 706, 677, 706, 705, 678, 679, 707, 678, 707, 706, 679, 680, 708, 679, 708, 707, 680, 681, 709, 680, 709, 708, 681, 55, 56, 681, 56, 709, 23, 682, 710, 23, 710, 24, 682, 683, 711, 682, 711, 710, 683, 684, 712, 683, 712, 711, 684, 685, 713, 684, 713, 712, 685, 686, 714, 685, 714, 713, 686, 687, 715, 686, 715, 714, 687, 688, 716, 687, 716, 715, 688, 689, 717, 688, 717, 716, 689, 690, 718, 689, 718, 717, 690, 691, 719, 690, 719, 718, 691, 692, 720, 691, 720, 719, 692, 693, 721, 692, 721, 720, 693, 694, 722, 693, 722, 721, 694, 695, 723, 694, 723, 722, 695, 696, 724, 695, 724, 723, 696, 697, 725, 696, 725, 724, 697, 698, 726, 697, 726, 725, 698, 699, 727, 698, 727, 726, 699, 700, 728, 699, 728, 727, 700, 701, 729, 700, 729, 728, 701, 702, 730, 701, 730, 729, 702, 703, 731, 702, 731, 730, 703, 704, 732, 703, 732, 731, 704, 705, 733, 704, 733, 732, 705, 706, 734, 705, 734, 733, 706, 707, 735, 706, 735, 734, 707, 708, 736, 707, 736, 735, 708, 709, 737, 708, 737, 736, 709, 56, 57, 709, 57, 737, 24, 710, 738, 24, 738, 25, 710, 711, 739, 710, 739, 738, 711, 712, 740, 711, 740, 739, 712, 713, 741, 712, 741, 740, 713, 714, 742, 713, 742, 741, 714, 715, 743, 714, 743, 742, 715, 716, 744, 715, 744, 743, 716, 717, 745, 716, 745, 744, 717, 718, 746, 717, 746, 745, 718, 719, 747, 718, 747, 746, 719, 720, 748, 719, 748, 747, 720, 721, 749, 720, 749, 748, 721, 722, 750, 721, 750, 749, 722, 723, 751, 722, 751, 750, 723, 724, 752, 723, 752, 751, 724, 725, 753, 724, 753, 752, 725, 726, 754, 725, 754, 753, 726, 727, 755, 726, 755, 754, 727, 728, 756, 727, 756, 755, 728, 729, 757, 728, 757, 756, 729, 730, 758, 729, 758, 757, 730, 731, 759, 730, 759, 758, 731, 732, 760, 731, 760, 759, 732, 733, 761, 732, 761, 760, 733, 734, 762, 733, 762, 761, 734, 735, 763, 734, 763, 762, 735, 736, 764, 735, 764, 763, 736, 737, 765, 736, 765, 764, 737, 57, 58, 737, 58, 765, 25, 738, 766, 25, 766, 26, 738, 739, 767, 738, 767, 766, 739, 740, 768, 739, 768, 767, 740, 741, 769, 740, 769, 768, 741, 742, 770, 741, 770, 769, 742, 743, 771, 742, 771, 770, 743, 744, 772, 743, 772, 771, 744, 745, 773, 744, 773, 772, 745, 746, 774, 745, 774, 773, 746, 747, 775, 746, 775, 774, 747, 748, 776, 747, 776, 775, 748, 749, 777, 748, 777, 776, 749, 750, 778, 749, 778, 777, 750, 751, 779, 750, 779, 778, 751, 752, 780, 751, 780, 779, 752, 753, 781, 752, 781, 780, 753, 754, 782, 753, 782, 781, 754, 755, 783, 754, 783, 782, 755, 756, 784, 755, 784, 783, 756, 757, 785, 756, 785, 784, 757, 758, 786, 757, 786, 785, 758, 759, 787, 758, 787, 786, 759, 760, 788, 759, 788, 787, 760, 761, 789, 760, 789, 788, 761, 762, 790, 761, 790, 789, 762, 763, 791, 762, 791, 790, 763, 764, 792, 763, 792, 791, 764, 765, 793, 764, 793, 792, 765, 58, 59, 765, 59, 793, 26, 766, 794, 26, 794, 27, 766, 767, 795, 766, 795, 794, 767, 768, 796, 767, 796, 795, 768, 769, 797, 768, 797, 796, 769, 770, 798, 769, 798, 797, 770, 771, 799, 770, 799, 798, 771, 772, 800, 771, 800, 799, 772, 773, 801, 772, 801, 800, 773, 774, 802, 773, 802, 801, 774, 775, 803, 774, 803, 802, 775, 776, 804, 775, 804, 803, 776, 777, 805, 776, 805, 804, 777, 778, 806, 777, 806, 805, 778, 779, 807, 778, 807, 806, 779, 780, 808, 779, 808, 807, 780, 781, 809, 780, 809, 808, 781, 782, 810, 781, 810, 809, 782, 783, 811, 782, 811, 810, 783, 784, 812, 783, 812, 811, 784, 785, 813, 784, 813, 812, 785, 786, 814, 785, 814, 813, 786, 787, 815, 786, 815, 814, 787, 788, 816, 787, 816, 815, 788, 789, 817, 788, 817, 816, 789, 790, 818, 789, 818, 817, 790, 791, 819, 790, 819, 818, 791, 792, 820, 791, 820, 819, 792, 793, 821, 792, 821, 820, 793, 59, 60, 793, 60, 821, 27, 794, 822, 27, 822, 28, 794, 795, 823, 794, 823, 822, 795, 796, 824, 795, 824, 823, 796, 797, 825, 796, 825, 824, 797, 798, 826, 797, 826, 825, 798, 799, 827, 798, 827, 826, 799, 800, 828, 799, 828, 827, 800, 801, 829, 800, 829, 828, 801, 802, 830, 801, 830, 829, 802, 803, 831, 802, 831, 830, 803, 804, 832, 803, 832, 831, 804, 805, 833, 804, 833, 832, 805, 806, 834, 805, 834, 833, 806, 807, 835, 806, 835, 834, 807, 808, 836, 807, 836, 835, 808, 809, 837, 808, 837, 836, 809, 810, 838, 809, 838, 837, 810, 811, 839, 810, 839, 838, 811, 812, 840, 811, 840, 839, 812, 813, 841, 812, 841, 840, 813, 814, 842, 813, 842, 841, 814, 815, 843, 814, 843, 842, 815, 816, 844, 815, 844, 843, 816, 817, 845, 816, 845, 844, 817, 818, 846, 817, 846, 845, 818, 819, 847, 818, 847, 846, 819, 820, 848, 819, 848, 847, 820, 821, 849, 820, 849, 848, 821, 60, 61, 821, 61, 849, 28, 822, 850, 28, 850, 29, 822, 823, 851, 822, 851, 850, 823, 824, 852, 823, 852, 851, 824, 825, 853, 824, 853, 852, 825, 826, 854, 825, 854, 853, 826, 827, 855, 826, 855, 854, 827, 828, 856, 827, 856, 855, 828, 829, 857, 828, 857, 856, 829, 830, 858, 829, 858, 857, 830, 831, 859, 830, 859, 858, 831, 832, 860, 831, 860, 859, 832, 833, 861, 832, 861, 860, 833, 834, 862, 833, 862, 861, 834, 835, 863, 834, 863, 862, 835, 836, 864, 835, 864, 863, 836, 837, 865, 836, 865, 864, 837, 838, 866, 837, 866, 865, 838, 839, 867, 838, 867, 866, 839, 840, 868, 839, 868, 867, 840, 841, 869, 840, 869, 868, 841, 842, 870, 841, 870, 869, 842, 843, 871, 842, 871, 870, 843, 844, 872, 843, 872, 871, 844, 845, 873, 844, 873, 872, 845, 846, 874, 845, 874, 873, 846, 847, 875, 846, 875, 874, 847, 848, 876, 847, 876, 875, 848, 849, 877, 848, 877, 876, 849, 61, 62, 849, 62, 877, 29, 850, 878, 29, 878, 30, 850, 851, 879, 850, 879, 878, 851, 852, 880, 851, 880, 879, 852, 853, 881, 852, 881, 880, 853, 854, 882, 853, 882, 881, 854, 855, 883, 854, 883, 882, 855, 856, 884, 855, 884, 883, 856, 857, 885, 856, 885, 884, 857, 858, 886, 857, 886, 885, 858, 859, 887, 858, 887, 886, 859, 860, 888, 859, 888, 887, 860, 861, 889, 860, 889, 888, 861, 862, 890, 861, 890, 889, 862, 863, 891, 862, 891, 890, 863, 864, 892, 863, 892, 891, 864, 865, 893, 864, 893, 892, 865, 866, 894, 865, 894, 893, 866, 867, 895, 866, 895, 894, 867, 868, 896, 867, 896, 895, 868, 869, 897, 868, 897, 896, 869, 870, 898, 869, 898, 897, 870, 871, 899, 870, 899, 898, 871, 872, 900, 871, 900, 899, 872, 873, 901, 872, 901, 900, 873, 874, 902, 873, 902, 901, 874, 875, 903, 874, 903, 902, 875, 876, 904, 875, 904, 903, 876, 877, 905, 876, 905, 904, 877, 62, 63, 877, 63, 905, 30, 878, 906, 30, 906, 31, 878, 879, 907, 878, 907, 906, 879, 880, 908, 879, 908, 907, 880, 881, 909, 880, 909, 908, 881, 882, 910, 881, 910, 909, 882, 883, 911, 882, 911, 910, 883, 884, 912, 883, 912, 911, 884, 885, 913, 884, 913, 912, 885, 886, 914, 885, 914, 913, 886, 887, 915, 886, 915, 914, 887, 888, 916, 887, 916, 915, 888, 889, 917, 888, 917, 916, 889, 890, 918, 889, 918, 917, 890, 891, 919, 890, 919, 918, 891, 892, 920, 891, 920, 919, 892, 893, 921, 892, 921, 920, 893, 894, 922, 893, 922, 921, 894, 895, 923, 894, 923, 922, 895, 896, 924, 895, 924, 923, 896, 897, 925, 896, 925, 924, 897, 898, 926, 897, 926, 925, 898, 899, 927, 898, 927, 926, 899, 900, 928, 899, 928, 927, 900, 901, 929, 900, 929, 928, 901, 902, 930, 901, 930, 929, 902, 903, 931, 902, 931, 930, 903, 904, 932, 903, 932, 931, 904, 905, 933, 904, 933, 932, 905, 63, 64, 905, 64, 933, 31, 906, 934, 31, 934, 32, 906, 907, 935, 906, 935, 934, 907, 908, 936, 907, 936, 935, 908, 909, 937, 908, 937, 936, 909, 910, 938, 909, 938, 937, 910, 911, 939, 910, 939, 938, 911, 912, 940, 911, 940, 939, 912, 913, 941, 912, 941, 940, 913, 914, 942, 913, 942, 941, 914, 915, 943, 914, 943, 942, 915, 916, 944, 915, 944, 943, 916, 917, 945, 916, 945, 944, 917, 918, 946, 917, 946, 945, 918, 919, 947, 918, 947, 946, 919, 920, 948, 919, 948, 947, 920, 921, 949, 920, 949, 948, 921, 922, 950, 921, 950, 949, 922, 923, 951, 922, 951, 950, 923, 924, 952, 923, 952, 951, 924, 925, 953, 924, 953, 952, 925, 926, 954, 925, 954, 953, 926, 927, 955, 926, 955, 954, 927, 928, 956, 927, 956, 955, 928, 929, 957, 928, 957, 956, 929, 930, 958, 929, 958, 957, 930, 931, 959, 930, 959, 958, 931, 932, 960, 931, 960, 959, 932, 933, 961, 932, 961, 960, 933, 64, 65, 933, 65, 961, 32, 934, 66, 32, 66, 0, 934, 935, 68, 934, 68, 66, 935, 936, 70, 935, 70, 68, 936, 937, 72, 936, 72, 70, 937, 938, 74, 937, 74, 72, 938, 939, 76, 938, 76, 74, 939, 940, 78, 939, 78, 76, 940, 941, 80, 940, 80, 78, 941, 942, 82, 941, 82, 80, 942, 943, 84, 942, 84, 82, 943, 944, 86, 943, 86, 84, 944, 945, 88, 944, 88, 86, 945, 946, 90, 945, 90, 88, 946, 947, 92, 946, 92, 90, 947, 948, 94, 947, 94, 92, 948, 949, 96, 948, 96, 94, 949, 950, 98, 949, 98, 96, 950, 951, 100, 950, 100, 98, 951, 952, 102, 951, 102, 100, 952, 953, 104, 952, 104, 102, 953, 954, 106, 953, 106, 104, 954, 955, 108, 954, 108, 106, 955, 956, 110, 955, 110, 108, 956, 957, 112, 956, 112, 110, 957, 958, 114, 957, 114, 112, 958, 959, 116, 958, 116, 114, 959, 960, 118, 959, 118, 116, 960, 961, 120, 960, 120, 118, 961, 65, 33, 961, 33, 120],
    "diffuse": [1.0, 0.0, 0.3, 1.0],
    "ambient": [1.0, 1.0, 1.0, 1.0]
};

var axis = {
    vertices: [
        -1, 0, 0,
        1, 0.1, 0,
        1, 0, 0,

        1, 0, 0,
        1, 0.1, 0,
        -1, 0.1, 0
    ]
};

var complexCube = {
    "vertices": [
        -0.5, 0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,

        -0.5, 0.5, 0.5,
        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,

        0.5, 0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,

        0.5, 0.5, -0.5,
        0.5, -0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, 0.5, -0.5,

        -0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,

        -0.5, -0.5, 0.5,
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5

    ],

    "indices": [
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23],

    "colors": [
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,

        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,

        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,

        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,

        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,

        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0
    ],
    "texcoords": [
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,

        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
    ],

    "diffuse": [1.0, 1.0, 1.0, 1.0]
};

var Axis = {
    alias: 'axis',
    dim: 10,
    vertices: [-10, 0.0, 0.0, 10, 0.0, 0.0, 0.0, -10 / 2, 0.0, 0.0, 10 / 2, 0.0, 0.0, 0.0, -10, 0.0, 0.0, 10],
    indices: [0, 1, 2, 3, 4, 5],
    colors: [1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1],
    wireframe: true,
    perVertexColor: true,
    build: function (d) {
        if (d) Axis.dim = d;
        else d = Axis.dim;
        Axis.vertices = [-d, 0.0, 0.0, d, 0.0, 0.0, 0.0, -d / 2, 0.0, 0.0, d / 2, 0.0, 0.0, 0.0, -d, 0.0, 0.0, d];
    }
}

var running = false;
var objects = [];
var textoload = 0;
var minimalCube = {
    alias: "cube-s",
    "vertices": [
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, -1.0,
        -1.0, 1.0, -1.0,
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0,
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, -1.0, -1.0,
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0
    ],
    "indices": [
        0, 1, 2,
        0, 2, 3,
        4, 6, 5,
        4, 7, 6,
        8, 9, 10,
        8, 10, 11,
        12, 13, 14,
        12, 14, 15,
        16, 17, 18,
        16, 18, 19,
        20, 22, 21,
        20, 23, 22
    ],
    "colors": [],
    "normals": [
        0.0, 0.0, 1.0,  // front face
        0.0, 0.0, -1.0, // back face
        -1.0, 0.0, 0.0, // left face
        1.0, 0.0, 0.0,  // right face
        0.0, 1.0, 0.0,  // top face
        0.0, 1.0, 0.0   // bottom face
    ]
};
var Meshes = {};
Meshes.LICENSE = "The Meshes are taken from the book WebGL Beginner´s Guide from packt publishing.";
Meshes.Wall = wallMesh;
Meshes.Flag = flagMesh;
Meshes.TexCube = texCubeMesh;
Meshes.Cone = coneMesh;
Meshes.Sphere = sphereMesh;
Meshes.Ball = ballMesh;
Meshes.ComplexCube = complexCube;
Meshes.Axis = Axis;

/**
 *
 *
 *
 *
 *
 *
 *
 * **********************************************************************************************************************************************
 */

min.Shader = {};
min.Shader.VERTEX_001 = VERTEX_001;
min.Shader.FRAGMENT_001 = FRAGMENT_001;

var VERTEX_001 = "attribute vec3 aVertexPosition;" +
    "attribute vec4 aVertexColor;" +
    "void main() { gl_Position = aVertexPosition; vColor = aVertexColor; }";

var FRAGMENT_001 = "precision highp float;" +
    "varying vec4 vColor;" +
    "void main() { gl_FragColor = vColor; }";

min.DOM = {};
min.DOM.get = function (url, callback, responseType) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    if (responseType) xhr.responseType = responseType;
    xhr.onloadend = function (e) {
        if (e.status < 400)
            resolve(e.response);
        else reject(new TypeError("can not resolve request"));
    };
    xhr.send(null);
    var p = new Promise(function (resolve, reject) {
        resolver = resolve;
        rejecter = reject;
    });

    p.then(callback, callback);
    return p;
}
min.DOM.getSync = function (url, callback, responseType) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    if (responseType) xhr.responseType = responseType;
    xhr.onloadend = function (e) {
        callback(e.response);
    };
    xhr.responseType = "arraybuffer";
    xhr.send(null);
    return xhr.response;
};
min.DOM.$ = myQuery();

function myQuery() {
    return function (str) {
        return [].slice.call(document, document.querySelectorAll(str));
    };
}

/**
 *
 *
 *
 *
 *
 * **********************************************************************************************************************************************
 */




min.GL.getContext = getContext;
min.GL.getCanvas = getCanvas;
min.GL.getShaderSource = getShaderSource;
min.GL.createCamera = createCamera
min.GL.createProgram = createProgram
min.GL.createLight = createLight


function MinWebAudioApplication() {

}
function MinWebGLApplication(canvas_selector) {
    "use strict";
    this.canvas = document.querySelector(canvas_selector);
    this.gl = this.canvas.getContext("webgl-experimental") || this.canvas.getContext("webgl");
    this._programs = [];
    this._modelmatrix = [];
    this.programs = [];
}
MinWebGLApplication.prototype = new MinWebAudioApplication();
MinWebGLApplication.prototype.createProgram = function (vertexShaderId, fragmentShaderId, attributeList, uniformList) {
    var program = new Program(this.gl, vertexShaderId, fragmentShaderId, attributeList, uniformList);
    this.programs.push(program);
    return program;
};

function createMesh(gl, domId, props) {

    
    if (typeof domId === "string") {
        var mesh = JSON.parse(document.getElementById(domId).textContent);
    } else if (domId && typeof domId == "object") {
        mesh = domId;
    }

    props = props || {};
    Object.keys(props).forEach(function (key) {
        this[key] = props[key];
    }, mesh);

    if (props.texture) {
        mesh.texture = createTexture(gl, texture, function (texture) {
            "use strict";

        });
    }

    mesh.uMVMatrix = "uMVMatrix";
    mesh.modelMatrix = mat4.create();
    mat4.identity(mesh.modelMatrix);

    mesh.createMV = function (camera) {
        "use strict";
        var mm = mat4.clone(this.modelMatrix);
        var vm = mat4.clone(camera.viewMatrix);
        mat4.invert(vm, vm);
        mat4.multiply(mm, mm, vm);
        return mm;
    };

    if (!mesh.update) mesh.update = emptyFunction;
    if (!mesh.draw)   mesh.draw = emptyFunction;

    if (!props.nobufs) createBuffers(gl, mesh);
    return mesh;
}

var emptyFunction = function () {
};

function createMatrices(obj) {
    var uMVMatrix = Mat4.identity();
    var uPMatrix = Mat4.identity();
    var uNMatrix = Mat3.identity();
    obj.uMVMatrix = uMVMatrix;
    obj.uPMatrix = uPMatrix;
    obj.uNMatrix = uNMatrix;
    return obj;
}



function getContext(id, options) {
    var canvas = document.getElementById(id);
    return canvas.getContext("webgl", options) || canvas.getContext("webgl-experimental", options);
}

function getCanvas(id) {
    var canvas = document.getElementById(id);
    return canvas;
}

function getShaderSource(id) {
    return document.getElementById(id).textContent;
}

function getOffscreenContext(id) {
    var canvas = document.createElement("canvas");
    return canvas.getContext("webgl") || canvas.getContext("webgl-experimental");
}

function createProgram(gl, vs, fs) {
    var vs = createShader(gl, gl.VERTEX_SHADER, vs);
    var fs = createShader(gl, gl.FRAGMENT_SHADER, fs);
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("error linking program: " + gl.getProgramInfoLog(program));
    }
    return {
        program: program,
        vshader: vs,
        fshader: fs
    };
}

function createShader(gl, type, source) {
    source = document.getElementById(source).textContent;
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("error compiling shader: " + gl.getShaderInfoLog(shader));
    }
    return shader;
}

function uploadMatrix4(gl, target, matrix) {
    "use strict";
    gl.uniformMatrix4fv(target, false, matrix);
}
function uploadMatrix3(gl, target, matrix) {
    "use strict";
    gl.uniformMatrix3fv(target, false, matrix);
}
function uploadSampler(gl, target, number) {
    "use strict";
    gl.uniform1i(target, number);
}

function getUniforms(gl, program, list) {
    list.forEach(function (key) {
        program[key] = gl.getUniformLocation(program, key);
    });
}

function getAttributes(gl, program, list) {
    list.forEach(function (key) {
        program[key] = gl.getAttribLocation(program, key);
    });
}

function createTexture(gl, source, callback) {
    var tex = gl.createTexture();
    var texImage = new Image();
    textoload++;
    texImage.onload = function () {
        textoload--;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        //gl.generateMipmap(gl.TEXTURE_2D);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texImage);
        if (textoload === 0) {
            requestAnimationFrame(callback)
        }
    };
    texImage.src = source;
    return {
        texture: tex,
        image: texImage
    };
}

function checkFramebufferStatus(gl, fb) {
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER, fb);
    switch (status) {
        case gl.FRAMEBUFFER_COMPLETE:
            console.error("FRAMEBUFFER COMPLETE");
            break;
        case gl.FRAMEBUFFER_UNSUPPORTED:
            console.error("FRAMEBUFFER UNSUPPORTED");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            console.error("FRAMEBUFFER INCOMPLETE MISSING ATTACHMENT");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            console.error("FRAMEBUFFER INCOMPLETE ATTACHMENT");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
            console.error("FRAMEBUFFER INCOMPLETE DIMENSIONS");
            break;
    }
}

function createOffscreenFramebuffer(gl, width, height) {

    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    var rbo = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);

    checkFramebufferStatus(gl, fbo);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return {
        fbo: fbo,
        rbo: rbo,
        texture: texture,
        width: width,
        height: height,
        bind: function () {
            "use strict";
            bindFramebuffer(gl, fbo, rbo);
        },
        unbind: function () {
            "use strict";
            unbindFramebuffer(gl);
        }
    };
}

function getLocations(gl, program, attributes, uniforms) {
    if (!Array.isArray(attributes)) {
        var o = attributes;
        getAttributes(gl, program, o.attributes);
        getUniforms(gl, program, o.uniforms);
        return;
    }
    getAttributes(gl, program, attributes);
    getUniforms(gl, program, uniforms);
}

function createMaterial(name, color) {
    "use strict";
    return {
        type: "material",
        name: "name",
        color: color,
        uMaterial: "uMaterial",
        update: function (gl, program) {
            gl.uniform4fv(program[this.uMaterial], this.color);
        }
    };
}

function createBuffers(gl, mesh) {
    if (mesh.vertices) {
        mesh.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
    }

    if (mesh.colors || mesh.scalars) {
        mesh.cbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.cbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(mesh.colors || mesh.scalars), gl.STATIC_DRAW);
    }

    if (mesh.normals) {
        mesh.nbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.normals), gl.STATIC_DRAW);
    }

    if (mesh.texcoords || mesh.tex_coords) {
        mesh.tbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.tbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.texcoords || mesh.tex_coords), gl.STATIC_DRAW);
    }

    if (mesh.indices) {
        mesh.ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
    }
    return mesh;
}



function Light(type, color, posOrDir, declaration) {
    this.glType = "Light";
    this.color = color;
    if (type === Light.DIRECTIONAL_LIGHT) {
        this.direction = posOrDir;
        this.showSource = false;
        Object.seal(this.showSource);
    } else if (type === Light.POSITIONAL_LIGHT) {
        this.position = posOrDir;
        this.showSource = true;
// Wie wirft man eine Textur als Licht? Eine neue Lampe koennte man hier dann einrichten, die tun sowas

    } else {
        throw new TypeError("unsupported type. Use Light.DIRECTIONAL or Light.POSITIONAL")
    }
    this.type = type;
    _mixin_(this, declaration);
};
Light.DIRECTIONAL = 1;
Light.POSITIONAL = 2;
Light.prototype = {
    update: function (gl, program, time) {
        if (this.position != undefined) {

            gl.uniform3fv(program[this.uLightPosition], this.position);
        }

        if (this.color != undefined) {

            gl.uniform4fv(program[this.uLightColor], this.color);
        }

        if (this.cutoff != undefined) {
            gl.uniform1f(program[this.uCutOff], this.cutoff);
        }
    },

};

function createLight(name, pos, color, cutoff) {
    return {
        type: "light",
        name: name,
        position: pos,
        color: color,
        cutoff: cutoff,
        uLighPosition: "ULightPosition",
        uLightColor: "uLightColor",
        uCutOff: "uCutOff",
        uNMatrix: "uNMatrix",
        updateLightPos: function (gl, nmat) {
            if (nmat.length == 9)
                Mat3.transform(this.position, nmat, this.position);
            else if (nmat.length = 16)
                Mat4.transform(this.position, nmat, this.position);
            this.direction = Vec3.flip(this.position);
        },
        update: function (gl, program, time) {
            if (this.position != undefined)
                gl.uniform3fv(program[this.uLightPosition], this.position);
            if (this.color != undefined) {
                gl.uniform4fv(program[this.uLightColor], this.color);
            }
            if (this.cutoff != undefined) {
                gl.uniform1f(program[this.uCutOff], this.cutoff);
            }
        }
    };
}



function createBuffers(gl, mesh) {
    if (mesh.vertices) {
        mesh.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
    }

    if (mesh.colors || mesh.scalars) {
        mesh.cbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.cbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(mesh.colors || mesh.scalars), gl.STATIC_DRAW);
    }

    if (mesh.normals) {
        mesh.nbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.normals), gl.STATIC_DRAW);
    }

    if (mesh.texcoords || mesh.tex_coords) {
        mesh.tbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.tbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.texcoords || mesh.tex_coords), gl.STATIC_DRAW);
    }

    if (mesh.indices) {
        mesh.ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
    }
    return mesh;
}

function createCamera(type, left, up, axis) {
    "use strict";
    return {
        type: type,
        left: left,
        up: up,
        axis: axis,
        uVMatrix: "uVMatrix",
        viewMatrix: mat4.create(),

        createModelView: function (mesh) {
            var modelMatrix = mesh.modelMatrix;
            var viewMatrix = mat4.create();
            mat4.clone(viewMatrix, this.viewMatrix);
            var modelViewMatrix = mat4.create();
            mat4.clone(modelViewMatrix, modelMatrix);
            mat4.invert(modelViewMatrix, modelViewMatrix);
            mat4.multiply(modelViewMatrix, modelViewMatrix, viewMatrix);
            return modelViewMatrix;
        },
        update: function (gl, program, time) {
            this.identity(this.viewMatrix);
            //this.translate(this.viewMatrix, this.viewMatrix, [-left, -up, -axis]);
            gl.uniformMatrix4fv(program[this.uVMatrix], false, uVMatrix);
        }
    };
}
function createFrustum() {
    return {
        type: "frustum",
        uPMatrix: "uPMatrix",
        projMatrix: mat4.create(),
        far: 100,
        near: 0.1,
        left: -10,
        right: 10,
        top: 10,
        bottom: -10,
        fovy: 45,
        aspect: 1,
        getAspect: function (gl) {
            return gl.viewportWidth / gl.viewportHeight;
        },

        update: function (gl, program, time) {
            gl.uniformMatrix4fv(program[this.uPMatrix], false, this.projMatrix);
        }
    };
}

function createShadowMap() {
    /*    return {
     buffers: createOffscreenFramebuffer
     texture:
     } */
}


var timer = {
    current: 0, // currentStop
    last: 0,    // lastStop
    elapsed: 0, // dt
    fps: 60,
    frameTime: 1000 / 60,
    start: function () {
        this._start = this.last = this.current = Date.now();
        this.current = Date.now();
        this.elapsed = 0;
        return this.current;
    },
    stop: function () {
        this.last = this.current;
        this.current = Date.now();
        this.elapsed = this.current - this.last;
        return this.elapsed;
    },
};
timer.take = timer.stop;    // alias

function bindFramebuffer(gl, fbo, rbo) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
}

function unbindFramebuffer(gl) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function drawGenericMesh(gl, program, mesh) {
    "use strict";

    gl.disableVertexAttribArray(0);
    gl.disableVertexAttribArray(1);
    gl.disableVertexAttribArray(2);
    gl.disableVertexAttribArray(3);
    gl.disableVertexAttribArray(4);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
    gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.aVertexPosition);

    //gl.vertexAttrib4fv(program.aVertexColor, [0.5,0.1,0.8,1.0]);

    if (mesh.cbo) {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.cbo);
        gl.vertexAttribPointer(program.aVertexColor, 4, gl.UNSIGNED_BYTE, false, 0, 0);
        gl.enableVertexAttribArray(program.aVertexColor);
    }

    if (mesh.tbo) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, mesh.texture);
        gl.uniform1i(program.uSampler, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.tbo);
        gl.vertexAttribPointer(program.aVertexNormal, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.aTextureCoord);
    }

    if (mesh.nbo) {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nbo);
        gl.vertexAttribPointer(program.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.aVertexNormal);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
    if (mesh.ibo) gl.drawElements(gl.TRIANGLE_STRIP, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    else gl.drawArrays(gl.TRIANGLE_STRIP, 0, mesh.vertices.length / 3);

    if (mesh.ibo) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    if (mesh.tbo) gl.bindTexture(gl.TEXTURE_2D, null);
}

function toPrec(n) {
    "use strict";
    return n.toPrecision(5);
}

function strVec(v3) {
    "use strict";
    return "<" + v3[0] + "," + v3[1] + "," + v3[2] + ">";
}
function printObj(id, obj) {
    "use strict";
    var html = "<table class=mesh>" +
        "<tr><th>prop</th><th>value</th></tr>" +
        "<tr><td>velocity</td><td>" + strVec(obj.velocity) + "</td>" +
        "<tr><td>position</td><td>" + strVec(obj.position) + "</td>" +
        "<tr><td>acceleration</td><td>" + strVec(obj.acceleration) + "</td>" +
        "</table>";
    document.getElementById(id).innerHTML = html;
    return html;
}

function showMatrix4(id, mat) {
    var html = "<table class=matrix>" +
        "<tr><th colspan='4'>" + id + "</th></tr>" +
        "<tr><th>x</th><th>y</th><th>z</th><th>w</th></tr>" +
        "<tr><td>" + toPrec(mat[0]) + "</td><td>" + toPrec(mat[4]) + "</td><td>" + toPrec(mat[8]) + "</td><td>" + toPrec(mat[12]) + "</td></tr>" +
        "<tr><td>" + toPrec(mat[1]) + "</td><td>" + toPrec(mat[5]) + "</td><td>" + toPrec(mat[9]) + "</td><td>" + toPrec(mat[13]) + "</td></tr>" +
        "<tr><td>" + toPrec(mat[2]) + "</td><td>" + toPrec(mat[6]) + "</td><td>" + toPrec(mat[10]) + "</td><td>" + toPrec(mat[14]) + "</td></tr>" +
        "<tr><td>" + toPrec(mat[3]) + "</td><td>" + toPrec(mat[7]) + "</td><td>" + toPrec(mat[11]) + "</td><td>" + toPrec(mat[15]) + "</td></tr>" +
        "</table>";
    document.getElementById(id).innerHTML = html;
}

function showMatrix3(id, mat) {
    var html = "<table class=matrix>" +
        "<tr><td colspan='3'>" + id + "</td></tr>" +
        "<tr><th>x</th><th>y</th><th>z</th></tr>" +
        "<tr><td>" + toPrec(mat[0]) + "</td><td>" + toPrec(mat[3]) + "</td><td>" + toPrec(mat[6]) + "</td></tr>" +
        "<tr><td>" + toPrec(mat[1]) + "</td><td>" + toPrec(mat[4]) + "</td><td>" + toPrec(mat[7]) + "</td></tr>" +
        "<tr><td>" + toPrec(mat[2]) + "</td><td>" + toPrec(mat[5]) + "</td><td>" + toPrec(mat[8]) + "</td></tr>" +
        "</table>";
    document.getElementById(id).innerHTML = html;
}

function showVec(id, vec) {
    var html = "<table class=vector>" +
        "<tr><td colspan='3'>" + id + "</td></tr>" +
        "<tr><th>x</th><th>y</th><th>z</th></tr>" +

        "<tr><td>" + toPrec(vec[0]) + "</td><td>" + toPrec(vec[1]) + "</td><td>" + toPrec(vec[2]) + "</td></tr>" +
        "</table>";
    document.getElementById(id).innerHTML = html;
}


/**
 *
 *
 *
 *
 * ***************************************************************************************************************
 */



function invertModelMatrix(mm, vm) {
    "use strict";
    var modelView = mat4.create();
    mat4.invert(modelView, mm);
    if (vm != undefined) {
        mat4.multiply(modelView, modelView, vm);
    }
    return modelView;
}


(function (global) {

    global.range = {};
    global.range.z2PI = [0, Math.PI*2];
    global.range.n1p1 = [-1, 1];
    global.range.n10p10 = [-10,10];
    global.range.zPI = [0, Math.PI];

    global.polar = {
	
	// ermittle Radius
	r: function getRadius(x,y) {
	    return Math.sqrt(x*x + y*y);
	},
	
	// ermittle Winkel
	theta: function getTheta(x,y) {
	    return Math.atan(y/x);
	},
	
	// hole x vom Winkel
	x: function (r, theta) {
	    return r * Math.cos(theta);
	},

	// hole y vom Winkel
	y: function (r, theta) {
	    return r * Math.sin(theta);
	}
	
    };
    
    global.cylindrical = {
	
	v: function (r, theta, z) {
	    return [ 
		r*Math.cos(theta), 
		r*Math.sin(theta), 
		z
	    ];
	}, 
	
	r: function (x, y) {
	    return Math.sqrt(x*x + y*y);
	},
	
	theta: function (x,y) {
	    return Math.atan(y/x);
	},
	
	z: function (z) {
	    return z;
	}
    
    };
    
    global.SMALL_ERROR = 1e-10;
    global.isSmallError = function (v, w) {
	return Math.abs(w - v) <= global.SMALL_ERROR;
    }
    
    global.spherical = {
	v: function (r, theta, phi) {
	    return [
		r * Math.cos(r) * Math.sin(phi),
		r * Math.sin(r) * Math.sin(phi),
		r * Math.cos(phi)
	    ];
	},
	r: function (x,y,z) {
	    if (Array.isArray(x)) {
		return Math.sqrt(x[0]*x[0]+x[1]*x[1]+x[2]*x[2]);
	    }
	    return Math.sqrt(x*x + y*y + z*z);
	},
	theta: function (z, r) {
	    return Math.atan(z/r);
	},
	phi: function (x,y) {
	    return Math.atan(y/x);
	}
	
    };
    
    global.cartesian = {};
    

}(typeof exports != "undefined" ? exports : this));

