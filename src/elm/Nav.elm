module Nav exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (onClick)


-- model


type alias Model =
    { isAuthed : Bool }


initialModel : Model
initialModel =
    { isAuthed = False }



-- update


type Msg
    = Login
    | Logout


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Login ->
            ( { model | isAuthed = True }, Cmd.none )

        Logout ->
            ( { model | isAuthed = False }, Cmd.none )



-- view


view : Model -> Html Msg
view model =
    if model.isAuthed then
        div []
            [ input [ type_ "button", value "Logout", onClick Logout ] []
            , a [ href "#/feed" ] [ text "Feed" ]
            ]
    else
        div []
            [ input [ type_ "button", value "Login", onClick Login ] [] ]
