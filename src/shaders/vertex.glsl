varying vec3 eyeVector;
varying vec3 worldNormal;

void main() {
	vec4 worldPos = modelMatrix * vec4( position, 1.0);
	eyeVector = normalize(worldPos.xyz - cameraPosition);
	worldNormal = normalize(normalMatrix * normal);

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}