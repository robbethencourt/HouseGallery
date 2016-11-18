module Main exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Navigation
import String


-- main


main : Program Never Model Msg
main =
    Html.beginnerProgram
        { model = initialModel
        , view = view
        , update = update
        }



-- model


type alias Model =
    { user : UserModel
    , usersGallery : Gallery
    , galleryFeed : List GalleryItem
    }


type alias UserModel =
    { isAuthed : Bool
    , error : String
    , userId : User
    }


type alias User =
    { username : String
    , userEmail : String
    , password : String
    }


type alias Gallery =
    { error : String
    , galleries : List GalleryItem
    }


type alias GalleryItem =
    { artist : String
    , title : String
    , year : Int
    , medium : String
    , status : String
    , price : Int
    }


initialModel : Model
initialModel =
    { user = { isAuthed = False, error = "", userId = { username = "", userEmail = "", password = "" } }
    , usersGallery = { error = "", galleries = [] }
    , galleryFeed = []
    }



-- update


type Msg
    = Input String
    | Something


update : Msg -> Model -> Model
update msg model =
    case msg of
        _ ->
            model



-- view


view : Model -> Html Msg
view model =
    div []
        [ input [ type_ "text" ] []
        , input [ type_ "text" ] []
        , input [ type_ "button", value "Login" ] []
        , p [] [ text (toString model) ]
        ]
