/* Overrides how Google Closure's provide and require functions work, in order for them to work with React Native's packager.
 */
if (typeof global !== 'undefined') {

    if (goog.LOCALE === undefined) {
        goog.LOCALE = "en";
    }

    //TODO: this should probably not be in here
    //React Native throws error because it does not support group logging
    console.groupCollapsed = console.groupCollapsed || console.log;
    console.group = console.group || console.log;
    console.groupEnd = function() {};

    goog.provide = function(name) {
        if (goog.isProvided_(name)) {
            return; //don't throw an error when called multiple times, because it is going to be called multiple times in from react-native
        }
        //Rest of the code is copied as is from Closure
        delete goog.implicitNamespaces_[name];

        var namespace = name;
        while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
            if (goog.getObjectByName(namespace)) {
                break;
            }
            goog.implicitNamespaces_[namespace] = true;
        }
        goog.exportPath_(name);
    };
    //Replace goog.require with react-native's implementation, skip errors, because there are going to be some (e.g. missing 'soft' depedencies) and we don't care about them
    var orig_require = goog.require;
    goog.require = function(name) {
        var oldErrorReporter = global.ErrorUtils.reportFatalError;
        //disable React error checking while we try to require
        //because we want to be able to try goog.require as well
        global.ErrorUtils.reportFatalError = function(e) { throw new Exception(e);};
        try {
            require(name);
        } catch (e) {
            //Try default goog.require behaviour
            var oldDebugLoader = goog.ENABLE_DEBUG_LOADER;
            goog.ENABLE_DEBUG_LOADER = true;
            try {
                orig_require.call(goog, name);
            } catch (e) {
                console.warn("Error while loading " + name);
                console.error(e);
            } finally {
                goog.ENABLE_DEBUG_LOADER = oldDebugLoader;
            }
        } finally {
            global.ErrorUtils.reportFatalError = oldErrorReporter; 
        }
    };
}

// Overrides environment to make other tools that expect browser environment work
function fakeLocalStorageAndDocument() {
    window.localStorage = {};
    window.localStorage.getItem = function() { console.warn('localStorage is faked - see goog/base.js');
                                               return 'true'; };
    window.localStorage.setItem = function() { console.warn('localStorage is faked - see goog/base.js'); };

    window.document = {};
    window.document.body = {};
    window.document.body.dispatchEvent = function() { console.warn('dispatchEvent is faked - see goog/base.js'); };
    window.document.createElement = function() {  console.warn('createElement is faked - see goog/base.js'); };

    if (typeof window.location === 'undefined') {
        console.log('Shimming window.location');
        window.location = {};
        window.location.href = "http://example.org";
        window.location.protocol = "http"; //for boot-reload "connect" event
    } else {
        console.warn('Not shimming window.location - location already set to ' + window.location.href);
    }
    window.addEventListener = function() {};
}
fakeLocalStorageAndDocument();


