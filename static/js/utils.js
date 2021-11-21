// Extended jquery functions
$.fn.removeClassStartingWith = function (filter) {
    $(this).removeClass(function (index, className) {
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

    /**
    * Generates a random password or credential of 16 characters of length. Used for device credentials
    */
    static generateCredentials() {

        let chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let length = 15;
        let password = "";

        for (var i = 0; i <= length; i++) {
            var randomNumber = Math.floor(Math.random() * chars.length);
            password += chars.substring(randomNumber, randomNumber +1);
        }

        return password;
    }

}

