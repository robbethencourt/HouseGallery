port module Signup exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import Json.Encode as JE
import Navigation


-- model


type alias Model =
    { username : String
    , email : String
    , password : String
    , error : Maybe String
    }


initModel : Model
initModel =
    { username = ""
    , password = ""
    , email = ""
    , error = Nothing
    }


init : ( Model, Cmd Msg )
init =
    ( initModel, Cmd.none )



-- update


type Msg
    = UsernameInput String
    | EmailInput String
    | PasswordInput String
    | Submit
    | Error String
    | UserSaved String


update : Msg -> Model -> ( Model, Cmd Msg, Maybe String )
update msg model =
    case msg of
        UsernameInput username ->
            ( { model | username = username }, Cmd.none, Nothing )

        EmailInput email ->
            ( { model | email = email }, Cmd.none, Nothing )

        PasswordInput password ->
            ( { model | password = password }, Cmd.none, Nothing )

        Submit ->
            let
                body =
                    JE.object
                        [ ( "username", JE.string model.username )
                        , ( "email", JE.string model.email )
                        , ( "password", JE.string model.password )
                        ]
                        |> JE.encode 4

                cmd =
                    saveUser body
            in
                ( model, cmd, Nothing )

        Error error ->
            ( { model | error = Just error }, Cmd.none, Nothing )

        UserSaved fbData ->
            ( { model
                | username = ""
                , email = ""
                , password = ""
              }
            , Navigation.newUrl "#/gallery"
            , Just fbData
            )


view : Model -> Html Msg
view model =
    div [ class "main" ]
        [ errorPanel model.error
        , signupForm model
          -- , p [] [ text (toString model) ]
        ]


signupForm : Model -> Html Msg
signupForm model =
    div [ class "row formRow" ]
        [ div [ class "col-md-6 col-md-offset-3" ]
            [ Html.form [ class "formRow__form", onSubmit Submit ]
                [ input
                    [ type_ "text"
                    , class "formRow__input formRow__input--username"
                    , placeholder "username"
                    , value model.username
                    , onInput UsernameInput
                    ]
                    []
                , input
                    [ type_ "email"
                    , class "formRow__input formRow__input--email"
                    , placeholder "email"
                    , value model.email
                    , onInput EmailInput
                    ]
                    []
                , input
                    [ type_ "password"
                    , class "formRow__input formRow__input--password"
                    , placeholder "password"
                    , value model.password
                    , onInput PasswordInput
                    ]
                    []
                , div [ class "form-group" ]
                    [ label [] []
                    , button
                        [ type_ "submit"
                        , class "btn btn--white formRow--btn"
                        ]
                        [ text "signup" ]
                    ]
                ]
            ]
        ]


errorPanel : Maybe String -> Html a
errorPanel error =
    case error of
        Nothing ->
            text ""

        Just msg ->
            div [ class "error" ]
                [ text msg ]



-- subscriptions


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ userSaved UserSaved ]


port saveUser : String -> Cmd msg


port userSaved : (String -> msg) -> Sub msg
