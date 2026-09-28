export const menuDefinition = [

    {
        label: "Song",
        children: [
            {
                label: "New",
                action: "Song_New"
            },
            {
                label: "Load",
                action: "Song_Load"
            },
            {
                label: "Save",
                action: "Song_Save"
            }
            /*,{
                label: "Export Midi-File",
                action: "Song_Export_Midi"
            }*/
        ]
    },

/*
    {
        label: "Edit",
        children: [
            {
                label: "Add Chord",
                action: () => alert("Gruppe2_Button1")
            },
                        {
                label: "Remove Chord",
                action: () => alert("Gruppe2_Button1")
            },
            {
                label: "Split Chord",
                action: () => alert("Gruppe2_Button1")
            },
            {
                label: "Add Song Part",
                action: () => alert("Gruppe2_Button2")
            },
            {
                label: "Remove Song Part",
                action: () => alert("Gruppe2_Button2")
            }
        ]
    },*/
    {
                label: "About",
                action: "Show_About"
    }

];