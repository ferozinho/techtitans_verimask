pragma circom 2.1.6;

include "comparators.circom";
include "poseidon.circom";

// Prove age >= threshold and GPA (tenths) >= threshold
// without revealing either value. Public hashes bind the
// witness to an issuer-signed credential.
template Predicates() {
    signal input age;
    signal input ageSalt;
    signal input gpa;
    signal input gpaSalt;

    signal input ageHash;
    signal input gpaHash;
    signal input ageThreshold;
    signal input gpaThreshold;

    component hAge = Poseidon(2);
    hAge.inputs[0] <== age;
    hAge.inputs[1] <== ageSalt;
    hAge.out === ageHash;

    component hGpa = Poseidon(2);
    hGpa.inputs[0] <== gpa;
    hGpa.inputs[1] <== gpaSalt;
    hGpa.out === gpaHash;

    component ageOk = GreaterEqThan(32);
    ageOk.in[0] <== age;
    ageOk.in[1] <== ageThreshold;
    ageOk.out === 1;

    component gpaOk = GreaterEqThan(32);
    gpaOk.in[0] <== gpa;
    gpaOk.in[1] <== gpaThreshold;
    gpaOk.out === 1;
}

component main { public [ageHash, gpaHash, ageThreshold, gpaThreshold] } = Predicates();
