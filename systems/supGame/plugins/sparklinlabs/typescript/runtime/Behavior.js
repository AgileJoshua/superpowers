function setupComponent(player, component, config) {
    if (config.propertyValues == null)
        return;
    var behaviorInfo = player.resources.behaviorProperties.behaviors[config.behaviorName];
    for (var name_1 in config.propertyValues) {
        var valueInfo = config.propertyValues[name_1];
        var ancestorBehaviorInfo = behaviorInfo;
        var behaviorPropertyInfo = void 0;
        while (ancestorBehaviorInfo != null) {
            behaviorPropertyInfo = ancestorBehaviorInfo.propertiesByName[name_1];
            if (behaviorPropertyInfo != null)
                break;
            ancestorBehaviorInfo = player.resources.behaviorProperties.behaviors[ancestorBehaviorInfo.parentBehavior];
        }
        if (behaviorPropertyInfo == null) {
            console.warn(("Tried to set a property named " + name_1 + " on behavior class " + component.__outer.constructor.name + " ") +
                "but no such property is declared. Skipping.");
            continue;
        }
        if (behaviorPropertyInfo.type !== valueInfo.type) {
            console.warn(("Tried to set a value of type " + valueInfo.type + " for property " + component.__outer.constructor.name + "." + name_1 + " ") +
                ("but property type is declared as " + behaviorPropertyInfo.type + ". Skipping."));
            continue;
        }
        // Convert value based on type
        switch (behaviorPropertyInfo.type) {
            case "Sup.Math.Vector2": {
                component.__outer[name_1] = new window.Sup.Math.Vector2(valueInfo.value.x, valueInfo.value.y);
                break;
            }
            case "Sup.Math.Vector3": {
                component.__outer[name_1] = new window.Sup.Math.Vector3(valueInfo.value.x, valueInfo.value.y, valueInfo.value.z);
                break;
            }
            default: {
                component.__outer[name_1] = valueInfo.value;
                break;
            }
        }
    }
}
exports.setupComponent = setupComponent;
