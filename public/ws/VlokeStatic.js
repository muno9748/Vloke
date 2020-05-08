const VlokeStatic = {
    AllBlocks: [
        { category: 'test', blocks: ["print","def_when_start"] }
    ],
    Utils: {
        generateId() {
            return Math.random().toString(36).substr(2, 8);
        },
        stopProjectWithError() {
            VlokeStatic.toast.alert();
            Vloke.engine.stop();
        }
    },
    BlockData: {
        print: {
            template: "%param% 출력 %param%",
            color: {
                default: '#6495ed',
                darken: '#4fa7ff',
                text: '#ffffff'
            },
            events: {
                event: false
            },
            params: [{
                name: 'INDICATOR',
                default: 'test_icon',
                type: 'indicator',
                id: (() => Math.random().toString(36).substr(2, 8))()
            },{
                name: 'VALUE',
                default: 'hello world',
                type: 'text',
                id: (() => Math.random().toString(36).substr(2, 8))()
            }],
            Execute(script) {
                alert(script.getParam('VALUE'));
            }
        },
        def_when_start: {
            template: "%param% 시작됐을 때",
            color: {
                default: '#22b14c',
                darken: '#1b9e41',
                text: '#ffffff'
            },
            events: {
                event: true,
                eventName: 'when_start',
                events: {
                    EventRaised: [(e) => {
                        e.Next();
                    }]
                }
            },
            params: [{
                name: 'INDICATOR',
                default: 'start_icon',
                type: 'indicator',
                id: (() => Math.random().toString(36).substr(2, 8))()
            }],
            Execute(script) {
                // Event blocks do nothing
            }
        }
    },
    BlockHTMLTemplate(block) {
        let template = " " + VlokeStatic.BlockData[block.type].template;
        let content = [];
        let splited = template.split(/%param%/gi).filter(el => el != "");
        if(template.split(/%param%/gi).length > 1) {
            splited.forEach((el,i) => {
                content.push([
                    el,
                    VlokeStatic.BlockData[block.type].params[i]?.default || '&nbsp;', 
                    VlokeStatic.BlockData[block.type].params[i]?.id, 
                    VlokeStatic.BlockData[block.type].params[i]?.type
                ]);
            });
            splited = JSON.parse(JSON.stringify(content));
            splited = splited.map((el,i) => {
                return [`<span>${el[0]}</span>`,(() => {
                    if(el[3] == 'text') {
                        return `<span class="textField" contenteditable="true" id="textField_${el[2]}">${el[1]}</span>`;
                    }
                    if(el[3] == 'indicator') {
                        return `<span><img src="/public/images/${el[1]}.svg" id="indicator_${el[2]}" class="indicator" /></span>`;
                    }
                })()];
            });
            content = [];
            splited.forEach(el => {
                content.push(el[0]);
                content.push(el[1]);
            });
        } else {
            content.push(`<span>${template}</span>`);
        }
        return `
            <div class="code" id="Block_${block.id}">
                ${content.join("\n")}
            </div>
        `;
    },
    BlockSchema: class BlockSchema {
        constructor(type) {
            this.type = type;
            this.id = VlokeStatic.Utils.generateId();
            this.params = (() => {
                let returnvalue = {};
                VlokeStatic.BlockData[type].params.forEach(el => {
                    returnvalue[el.id] = {value:el.default,name:el.name};
                });
                returnvalue.length = Object.keys(returnvalue).length;
                return returnvalue;
            })();
            this.child = "";
            this.element = null;
            this.Execute = VlokeStatic.BlockData[type].Execute;
            this.pos = {
                sX: 0,
                sY: 0,
                X: 0,
                Y: 0,
                isFit: false,
                fX: 0,
                fY: 0
            };
            this.events = VlokeStatic.BlockData[type].events;
            $('.playground .ws').prepend(VlokeStatic.BlockHTMLTemplate(this));
            this.element = $(`#Block_${this.id}`)[0];
            this.$element = $(this.element);
            this.$element.css('background',VlokeStatic.BlockData[type].color.default);
            this.$element.css('border',`1px ${VlokeStatic.BlockData[type].color.darken} solid`);
            this.$element.css('color',VlokeStatic.BlockData[type].color.text);
            this.$element.find('.textField').css('background', VlokeStatic.BlockData[type].color.field)
            Vloke.playground.scripts.push(this);
        }
    },
    Categorys: [
        'test'
    ]
};
window.VlokeStatic = VlokeStatic;