module Main exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Nav


-- import Navigation
-- import String
-- model


type alias AppModel =
    { navModel : Nav.Model
    , user : UserModel
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


initialModel : AppModel
initialModel =
    { navModel = Nav.initialModel
    , user = { isAuthed = False, error = "", userId = { username = "", userEmail = "", password = "" } }
    , usersGallery = { error = "", galleries = [] }
    , galleryFeed = []
    }


init : ( AppModel, Cmd Msg )
init =
    ( initialModel, Cmd.none )



-- update
-- type RemoteData e a
--     = NotAsked
--     | Loading
--     | Success e
--     | Failure a


type Msg
    = NavMsg Nav.Msg


update : Msg -> AppModel -> ( AppModel, Cmd Msg )
update msg model =
    case msg of
        NavMsg subMsg ->
            let
                ( updatedNavModel, navCmd ) =
                    Nav.update subMsg model.navModel
            in
                ( { model | navModel = updatedNavModel }, Cmd.map NavMsg navCmd )



-- view


view : AppModel -> Html Msg
view model =
    div []
        [ Html.map NavMsg (Nav.view model.navModel)
        , div []
            [ input [ type_ "text" ] []
            , input [ type_ "text" ] []
            , p [] [ text (toString model) ]
            ]
        ]



-- subscriptions


subscriptions : AppModel -> Sub Msg
subscriptions model =
    Sub.none



-- app
-- main


main : Program Never AppModel Msg
main =
    program
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
