uniform sampler2D envMap;
uniform sampler2D backfaceMap;
uniform vec2 u_resolution;

varying vec3 worldNormal;
varying vec3 eyeVector;

float Fresnel(vec3 eyeVector, vec3 worldNormal) {
	return pow( 1.0 + dot( eyeVector, worldNormal), 6.0 );
}

void main() {
	// get screen coordinates
	vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 backfaceNormal = texture2D(backfaceMap, uv).rgb;

	float a = 0.33;
    vec3 normal = worldNormal * (1.0 - a) - backfaceNormal * a;
	// calculate refraction and add to the screen coordinates
	vec3 refracted = refract(eyeVector, normal, 1.0/1.1);
	uv += refracted.xy;
	
	// sample the background texture
	vec4 tex = texture2D(envMap, uv);

    // calculate the Fresnel ratio
	float f = Fresnel(eyeVector, normal);

	// mix the refraction color and reflection color
	vec3 color = mix(tex.rgb, vec3(1.0), f);

	gl_FragColor = vec4(color, 1.0);
    // transform color from linear colorSpace to sRGBColorSpace
    gl_FragColor = linearToOutputTexel( gl_FragColor );
}