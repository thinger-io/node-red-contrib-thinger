// Extended jquery functions
$.fn.removeClassStartingWith = function (filter) {
    $(this).removeClass(function (_index, className) {
        return (className.match(new RegExp("\\S*" + filter + "\\S*", 'g')) || []).join(' ')
    });
    return this;
};

class ThingerUtils {

    // Capitalizes each word of a string keeping spaces intact
    static capitalize(string) {
        const words = string.split(" ");

        return words.map((word) => {
            return word[0].toUpperCase()+word.substring(1);
        }).join(" ");
    }

    // Capitalize only the first letter of the string
    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }


    /**
    * Generates a random password or credential of 16 characters of length. Used for device credentials
    */
    static generateCredentials() {

        const crypto = window.crypto;

        let chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let length = 15;

        return Array.from(crypto.getRandomValues(new Uint32Array(length)))
          .map((x) => chars[x % chars.length])
          .join('');

    }

    /**
     * This function returns the env var of a given node by hierarchy (group < subflow || flow)
     * @param node
     * @param envVar the env var to search for (ex: "THINGER_PROJECT")
     */
    static getNodeRedThingerEnvVar(node, envVar) {

        let parent;
        if (node.g) {
            parent = RED.nodes.group(node.g)
        } else if (node.z) {
            parent = RED.nodes.workspace(node.z) || RED.nodes.subflow(node.z)
        }

        if ( parent ) {

            if (parent.env && parent.env.find(obj => obj["name"] === envVar)) {
                return parent.env.find(obj => obj["name"] === envVar).value;
            } else {
                return ThingerUtils.getNodeRedThingerEnvVar(parent, envVar);
            }

        }
        return "";

    }

}

