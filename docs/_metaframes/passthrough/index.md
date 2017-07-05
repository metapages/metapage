---
layout: vanilla
---
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->

    <script src="{{site.baseurl}}{{site.data.urls.promise_polyfill}}"></script>

    <title>Metaframe pipe passthrough</title>
    <!-- <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous"> -->

    <style>
        .arrow_box_right {
            position: relative;
            background: #88b7d5;
            border: 4px solid #c2e1f5;
        }
        .arrow_box_right:after, .arrow_box_right:before {
            left: 100%;
            top: 50%;
            border: solid transparent;
            content: " ";
            height: 0;
            width: 0;
            position: absolute;
            pointer-events: none;
        }

        .arrow_box_right:after {
            border-color: rgba(136, 183, 213, 0);
            border-left-color: #88b7d5;
            border-width: 30px;
            margin-top: -30px;
        }
        .arrow_box_right:before {
            border-color: rgba(194, 225, 245, 0);
            border-left-color: #c2e1f5;
            border-width: 36px;
            margin-top: -36px;
        }
    </style>
    <style>
        .arrow_box_top {
            position: relative;
            background: #88b7d5;
            border: 4px solid #c2e1f5;
        }
        .arrow_box_top:after, .arrow_box_top:before {
            bottom: 100%;
            left: 50%;
            border: solid transparent;
            content: " ";
            height: 0;
            width: 0;
            position: absolute;
            pointer-events: none;
        }

        .arrow_box_top:after {
            border-color: rgba(136, 183, 213, 0);
            border-bottom-color: #88b7d5;
            border-width: 30px;
            margin-left: -30px;
        }
        .arrow_box_top:before {
            border-color: rgba(194, 225, 245, 0);
            border-bottom-color: #c2e1f5;
            border-width: 36px;
            margin-left: -36px;
        }
    </style>
    <style>
        .arrow_box_bottom {
            position: relative;
            background: #88b7d5;
            border: 4px solid #c2e1f5;
        }
        .arrow_box_bottom:after, .arrow_box_bottom:before {
            top: 100%;
            left: 50%;
            border: solid transparent;
            content: " ";
            height: 0;
            width: 0;
            position: absolute;
            pointer-events: none;
        }

        .arrow_box_bottom:after {
            border-color: rgba(136, 183, 213, 0);
            border-top-color: #88b7d5;
            border-width: 30px;
            margin-left: -30px;
        }
        .arrow_box_bottom:before {
            border-color: rgba(194, 225, 245, 0);
            border-top-color: #c2e1f5;
            border-width: 36px;
            margin-left: -36px;
        }
    </style>
    <style>
        .arrow_box_left {
            position: relative;
            background: #88b7d5;
            border: 4px solid #c2e1f5;
        }
        .arrow_box_left:after, .arrow_box_left:before {
            right: 100%;
            top: 50%;
            border: solid transparent;
            content: " ";
            height: 0;
            width: 0;
            position: absolute;
            pointer-events: none;
        }

        .arrow_box_left:after {
            border-color: rgba(136, 183, 213, 0);
            border-right-color: #88b7d5;
            border-width: 30px;
            margin-top: -30px;
        }
        .arrow_box_left:before {
            border-color: rgba(194, 225, 245, 0);
            border-right-color: #c2e1f5;
            border-width: 36px;
            margin-top: -36px;
        }
    </style>







    <style>
        #padded {
            padding-top: 40px;
            padding-right: 40px;
            padding-bottom: 40px;
            padding-left: 40px;
        }
    </style>
</head>
<body>
<div id="padded">
        <div id="arrow_box" class="arrow_box_right">
            <h3>Piped Values</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody id="inputs">
                </tbody>
            </table>
        </div>
    </div>
</body>
<script src="{{site.baseurl}}{{site.data.urls.metaframe_library_path}}"></script>
<script src="index.js"></script>
