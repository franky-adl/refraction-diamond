uniform sampler2D envMap;
uniform vec2 u_resolution;

varying vec3 worldNormal;
varying vec3 eyeVector;

void main() {
	// get screen coordinates
	vec2 uv = gl_FragCoord.xy / u_resolution;

	vec3 normal = worldNormal;
	// calculate refraction and add to the screen coordinates
	vec3 refracted = refract(eyeVector, normal, 1.0/1.1);
	uv += refracted.xy;
	
	// sample the background texture
	vec4 tex = texture2D(envMap, uv);

	gl_FragColor = vec4(tex.rgb, 1.0);
    // transform color from linear colorSpace to sRGBColorSpace
    gl_FragColor = linearToOutputTexel( gl_FragColor );
}